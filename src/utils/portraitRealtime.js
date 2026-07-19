const CHANNEL_NAME = "redencao-portrait-realtime-v2";
const STORAGE_KEY = "redencao-portrait-realtime-event";
const WINDOW_EVENT = "redencao:portrait-event";
const TOKEN_PREFIX = "redencao-portrait-token:";
const MQTT_URL = "wss://broker.emqx.io:8084/mqtt";

let conexaoRemota = null;
let contadorPacote = 1;

function criarIdEvento() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function criarTokenAleatorio() {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `${criarIdEvento()}-${criarIdEvento()}`.replace(/[^a-zA-Z0-9]/g, "");
}

export function obterTokenPortrait(fichaId) {
  const id = String(fichaId ?? "");
  if (!id) return "";

  const chave = `${TOKEN_PREFIX}${id}`;
  try {
    const existente = localStorage.getItem(chave);
    if (existente) return existente;

    const novo = criarTokenAleatorio();
    localStorage.setItem(chave, novo);
    return novo;
  } catch {
    return criarTokenAleatorio();
  }
}

function textoParaBytes(texto) {
  return new TextEncoder().encode(String(texto));
}

function bytesParaTexto(bytes) {
  return new TextDecoder().decode(bytes);
}

function codificarComprimento(valor) {
  const bytes = [];
  let restante = valor;
  do {
    let byte = restante % 128;
    restante = Math.floor(restante / 128);
    if (restante > 0) byte |= 128;
    bytes.push(byte);
  } while (restante > 0);
  return bytes;
}

function codificarString(texto) {
  const bytes = textoParaBytes(texto);
  return [(bytes.length >> 8) & 0xff, bytes.length & 0xff, ...bytes];
}

function montarPacote(tipo, conteudo) {
  return new Uint8Array([tipo, ...codificarComprimento(conteudo.length), ...conteudo]);
}

function pacoteConnect(clientId) {
  const cabecalhoVariavel = [
    ...codificarString("MQTT"),
    4, // MQTT 3.1.1
    2, // clean session
    0,
    30, // keep alive
  ];
  return montarPacote(0x10, [...cabecalhoVariavel, ...codificarString(clientId)]);
}

function proximoIdPacote() {
  contadorPacote = (contadorPacote % 65535) + 1;
  return contadorPacote;
}

function pacoteSubscribe(topico) {
  const id = proximoIdPacote();
  return montarPacote(0x82, [
    (id >> 8) & 0xff,
    id & 0xff,
    ...codificarString(topico),
    0, // QoS 0
  ]);
}

function pacotePublish(topico, mensagem) {
  const payload = textoParaBytes(mensagem);
  return montarPacote(0x30, [...codificarString(topico), ...payload]);
}

function juntarBytes(a, b) {
  const resultado = new Uint8Array(a.length + b.length);
  resultado.set(a, 0);
  resultado.set(b, a.length);
  return resultado;
}

function lerComprimentoRestante(bytes, inicio) {
  let multiplicador = 1;
  let valor = 0;
  let indice = inicio;
  let byte;

  do {
    if (indice >= bytes.length) return null;
    byte = bytes[indice];
    valor += (byte & 127) * multiplicador;
    multiplicador *= 128;
    indice += 1;
    if (multiplicador > 128 * 128 * 128 * 128) return null;
  } while ((byte & 128) !== 0);

  return { valor, bytesUsados: indice - inicio };
}

function topicoDoToken(token) {
  return `redencao/portrait/v2/${token}`;
}

function criarConexaoMqtt({ fichaId, token, aoEvento }) {
  const topico = topicoDoToken(token);
  const listeners = new Set();
  if (aoEvento) listeners.add(aoEvento);

  const conexao = {
    chave: `${fichaId}:${token}`,
    fichaId: String(fichaId),
    token,
    topico,
    listeners,
    socket: null,
    conectado: false,
    encerrado: false,
    fila: [],
    buffer: new Uint8Array(0),
    timerReconectar: null,
    timerPing: null,
    tentativa: 0,
  };

  const entregar = (payload) => {
    conexao.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.error("Erro no listener do Portrait:", error);
      }
    });
  };

  const enviar = (pacote) => {
    if (conexao.socket?.readyState === WebSocket.OPEN) {
      conexao.socket.send(pacote);
    }
  };

  const publicarFila = () => {
    if (!conexao.conectado) return;
    while (conexao.fila.length) {
      const payload = conexao.fila.shift();
      enviar(pacotePublish(topico, JSON.stringify(payload)));
    }
  };

  const processarPacotes = () => {
    let deslocamento = 0;

    while (deslocamento < conexao.buffer.length) {
      if (deslocamento + 2 > conexao.buffer.length) break;
      const primeiroByte = conexao.buffer[deslocamento];
      const restante = lerComprimentoRestante(conexao.buffer, deslocamento + 1);
      if (!restante) break;

      const inicioConteudo = deslocamento + 1 + restante.bytesUsados;
      const fimPacote = inicioConteudo + restante.valor;
      if (fimPacote > conexao.buffer.length) break;

      const tipo = primeiroByte >> 4;
      const conteudo = conexao.buffer.slice(inicioConteudo, fimPacote);

      if (tipo === 2 && conteudo.length >= 2 && conteudo[1] === 0) {
        conexao.conectado = true;
        conexao.tentativa = 0;
        enviar(pacoteSubscribe(topico));
        publicarFila();
      }

      if (tipo === 3 && conteudo.length >= 2) {
        const tamanhoTopico = (conteudo[0] << 8) | conteudo[1];
        const inicioPayload = 2 + tamanhoTopico;
        if (inicioPayload <= conteudo.length) {
          const topicoRecebido = bytesParaTexto(conteudo.slice(2, inicioPayload));
          if (topicoRecebido === topico) {
            try {
              entregar(JSON.parse(bytesParaTexto(conteudo.slice(inicioPayload))));
            } catch (error) {
              console.debug("Mensagem MQTT inválida:", error);
            }
          }
        }
      }

      deslocamento = fimPacote;
    }

    if (deslocamento > 0) {
      conexao.buffer = conexao.buffer.slice(deslocamento);
    }
  };

  const agendarReconexao = () => {
    if (conexao.encerrado || conexao.timerReconectar) return;
    conexao.conectado = false;
    const espera = Math.min(8000, 700 * 2 ** conexao.tentativa);
    conexao.tentativa += 1;
    conexao.timerReconectar = window.setTimeout(() => {
      conexao.timerReconectar = null;
      conectar();
    }, espera);
  };

  const conectar = () => {
    if (conexao.encerrado || typeof WebSocket === "undefined") return;

    try {
      const socket = new WebSocket(MQTT_URL, ["mqtt"]);
      conexao.socket = socket;
      conexao.buffer = new Uint8Array(0);
      socket.binaryType = "arraybuffer";

      socket.onopen = () => {
        const clientId = `redencao_${criarIdEvento().replace(/[^a-zA-Z0-9]/g, "").slice(0, 22)}`;
        enviar(pacoteConnect(clientId));
        window.clearInterval(conexao.timerPing);
        conexao.timerPing = window.setInterval(() => {
          if (conexao.conectado) enviar(new Uint8Array([0xc0, 0x00]));
        }, 20000);
      };

      socket.onmessage = async (event) => {
        let novosBytes;
        if (event.data instanceof ArrayBuffer) {
          novosBytes = new Uint8Array(event.data);
        } else if (event.data?.arrayBuffer) {
          novosBytes = new Uint8Array(await event.data.arrayBuffer());
        } else {
          return;
        }
        conexao.buffer = juntarBytes(conexao.buffer, novosBytes);
        processarPacotes();
      };

      socket.onerror = () => {
        try {
          socket.close();
        } catch {
          // Nada a fazer.
        }
      };

      socket.onclose = () => {
        conexao.conectado = false;
        window.clearInterval(conexao.timerPing);
        agendarReconexao();
      };
    } catch (error) {
      console.debug("Não foi possível conectar o Portrait em tempo real:", error);
      agendarReconexao();
    }
  };

  conexao.publicar = (payload) => {
    if (conexao.conectado) {
      enviar(pacotePublish(topico, JSON.stringify(payload)));
    } else {
      conexao.fila.push(payload);
      if (conexao.fila.length > 20) conexao.fila.shift();
    }
  };

  conexao.adicionarListener = (listener) => {
    if (listener) conexao.listeners.add(listener);
  };

  conexao.removerListener = (listener) => {
    if (listener) conexao.listeners.delete(listener);
  };

  conexao.fechar = () => {
    conexao.encerrado = true;
    window.clearTimeout(conexao.timerReconectar);
    window.clearInterval(conexao.timerPing);
    try {
      conexao.socket?.close();
    } catch {
      // Nada a fazer.
    }
  };

  conectar();
  return conexao;
}

export function conectarCanalPortraitRemoto({ fichaId, token, aoEvento }) {
  const id = String(fichaId ?? "");
  const tokenSeguro = String(token ?? "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!id || !tokenSeguro) return () => {};

  const chave = `${id}:${tokenSeguro}`;
  if (!conexaoRemota || conexaoRemota.chave !== chave || conexaoRemota.encerrado) {
    conexaoRemota?.fechar();
    conexaoRemota = criarConexaoMqtt({ fichaId: id, token: tokenSeguro, aoEvento });
  } else {
    conexaoRemota.adicionarListener(aoEvento);
  }

  return () => {
    conexaoRemota?.removerListener(aoEvento);
  };
}

function publicarRemotamente(payload) {
  conexaoRemota?.publicar(payload);
}

export function publicarEventoPortrait(evento) {
  const payload = {
    ...evento,
    fichaId: String(evento.fichaId ?? ""),
    eventId: evento.eventId || criarIdEvento(),
    emitidoEm: Date.now(),
  };

  // Comunicação instantânea entre abas do mesmo navegador.
  try {
    const canal = new BroadcastChannel(CHANNEL_NAME);
    canal.postMessage(payload);
    canal.close();
  } catch (error) {
    console.debug("BroadcastChannel indisponível:", error);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.debug("localStorage indisponível:", error);
  }

  try {
    window.dispatchEvent(new CustomEvent(WINDOW_EVENT, { detail: payload }));
  } catch (error) {
    console.debug("CustomEvent indisponível:", error);
  }

  // Comunicação em tempo real entre o navegador e a Fonte de Navegador do OBS.
  publicarRemotamente(payload);
  return payload;
}

export function publicarRolagemPortrait({
  fichaId,
  tipo,
  nome,
  valor,
  tipoSucesso,
}) {
  return publicarEventoPortrait({
    evento: "rolagem",
    fichaId,
    tipo,
    nome,
    valor,
    tipoSucesso,
  });
}

export function publicarStatusPortrait({
  fichaId,
  pvAtual,
  pvMax,
  sanAtual,
  sanMax,
  peAtual,
  peMax,
}) {
  return publicarEventoPortrait({
    evento: "status",
    fichaId,
    pvAtual,
    pvMax,
    sanAtual,
    sanMax,
    peAtual,
    peMax,
  });
}

export function assinarEventosPortrait(callback) {
  let canal = null;

  const entregar = (payload) => {
    if (!payload || typeof payload !== "object") return;
    callback(payload);
  };

  try {
    canal = new BroadcastChannel(CHANNEL_NAME);
    canal.onmessage = (event) => entregar(event.data);
  } catch (error) {
    console.debug("BroadcastChannel indisponível:", error);
  }

  const aoAlterarStorage = (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      entregar(JSON.parse(event.newValue));
    } catch (error) {
      console.debug("Evento de portrait inválido:", error);
    }
  };

  const aoReceberEventoLocal = (event) => entregar(event.detail);

  window.addEventListener("storage", aoAlterarStorage);
  window.addEventListener(WINDOW_EVENT, aoReceberEventoLocal);

  return () => {
    if (canal) canal.close();
    window.removeEventListener("storage", aoAlterarStorage);
    window.removeEventListener(WINDOW_EVENT, aoReceberEventoLocal);
  };
}
