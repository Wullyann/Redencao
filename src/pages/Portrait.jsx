import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  assinarEventosPortrait,
  conectarCanalPortraitRemoto,
  obterTokenPortrait,
} from "../utils/portraitRealtime";
import "./Portrait.css";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

const CORES_SUCESSO = {
  Desastre: "#ff244f",
  Fracasso: "#ff3b45",
  Sucesso: "#38ff67",
  "Sucesso Bom": "#38e7ff",
  "Sucesso Extremo": "#f5fbff",
  "Sucesso Perfeito": "#ffd43b",
  Dano: "#ff7a3d",
};

function numero(valor, fallback = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : fallback;
}

function assinaturaRolagem(rolagem) {
  return [
    rolagem?.tipo ?? rolagem?.Tipo ?? "",
    rolagem?.nome ?? rolagem?.Nome ?? "",
    rolagem?.valor ?? rolagem?.Valor ?? "",
    rolagem?.tipoSucesso ?? rolagem?.["Tipo de Sucesso"] ?? "",
  ].join("|");
}

function normalizarRolagem(rolagem) {
  return {
    tipo: rolagem?.tipo ?? rolagem?.Tipo ?? "Rolagem",
    nome: rolagem?.nome ?? rolagem?.Nome ?? "Teste",
    valor: rolagem?.valor ?? rolagem?.Valor ?? "-",
    tipoSucesso:
      rolagem?.tipoSucesso ?? rolagem?.["Tipo de Sucesso"] ?? "",
    eventId:
      rolagem?.eventId ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
}

function Barra({ atual, maximo, classe }) {
  const atualSeguro = Math.max(0, numero(atual));
  const maxSeguro = Math.max(0, numero(maximo));
  const percentual =
    maxSeguro > 0
      ? Math.min(100, Math.max(0, (atualSeguro / maxSeguro) * 100))
      : 0;

  return (
    <div className={`portrait-bar ${classe}`}>
      <div
        className="portrait-bar-fill"
        style={{ width: `${percentual}%` }}
      />
      <strong className="portrait-bar-value">
        {atualSeguro}/{maxSeguro}
      </strong>
    </div>
  );
}

function D20({ valor }) {
  return (
    <div className="portrait-d20">
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <polygon
          className="portrait-d20-face"
          points="110,8 199,60 188,166 110,212 28,164 18,61"
        />
        <polyline points="110,8 67,63 18,61" />
        <polyline points="110,8 153,63 199,60" />
        <polyline points="18,61 67,63 48,139 28,164" />
        <polyline points="199,60 153,63 171,139 188,166" />
        <polyline points="28,164 48,139 110,212" />
        <polyline points="188,166 171,139 110,212" />
        <polygon points="67,63 153,63 171,139 110,178 48,139" />
        <line x1="110" y1="8" x2="110" y2="178" />
        <line x1="18" y1="61" x2="171" y2="139" />
        <line x1="199" y1="60" x2="48" y2="139" />
      </svg>
      <strong>{valor}</strong>
    </div>
  );
}

export default function Portrait() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const tokenUrl = searchParams.get("token") || "";
  const tokenRealtime = tokenUrl || obterTokenPortrait(id);
  const [ficha, setFicha] = useState(null);
  const [erro, setErro] = useState("");
  const [rolagem, setRolagem] = useState(null);
  const primeiraLeituraRolagens = useRef(true);
  const ultimaAssinaturaRef = useRef("");
  const ultimaAssinaturaPlanilhaRef = useRef("");
  const ultimaExibicaoRef = useRef(0);
  const timerRolagemRef = useRef(null);
  const fichaCarregadaRef = useRef(false);

  const exibirRolagem = useCallback((dados, origem = "realtime") => {
    const normalizada = normalizarRolagem(dados);
    const assinatura = assinaturaRolagem(normalizada);
    const agora = Date.now();

    // Evita que a mesma rolagem apareça uma segunda vez quando chegar da planilha.
    if (
      assinatura === ultimaAssinaturaRef.current &&
      agora - ultimaExibicaoRef.current < 12000
    ) {
      return;
    }

    ultimaAssinaturaRef.current = assinatura;
    ultimaExibicaoRef.current = agora;
    window.clearTimeout(timerRolagemRef.current);
    setRolagem({ ...normalizada, origem });
    timerRolagemRef.current = window.setTimeout(() => {
      setRolagem(null);
    }, 7000);
  }, []);

  useEffect(() => {
    const bodyBackground = document.body.style.background;
    const htmlBackground = document.documentElement.style.background;
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";

    return () => {
      document.body.style.background = bodyBackground;
      document.documentElement.style.background = htmlBackground;
    };
  }, []);

  useEffect(() => {
    if (!id) return undefined;

    const receberEvento = (evento) => {
      if (String(evento.fichaId) !== String(id)) return;

      if (evento.evento === "rolagem") {
        exibirRolagem(evento, "realtime");
        return;
      }

      if (evento.evento === "status") {
        setFicha((anterior) => {
          if (!anterior) return anterior;
          return {
            ...anterior,
            "PV Atual": evento.pvAtual,
            "PV Máx.": evento.pvMax,
            "Sanidade Atual": evento.sanAtual,
            "Sanidade Máx.": evento.sanMax,
            "PE Atual": evento.peAtual,
            "PE Máx.": evento.peMax,
          };
        });
      }
    };

    const cancelarLocal = assinarEventosPortrait(receberEvento);
    const cancelarRemoto = conectarCanalPortraitRemoto({
      fichaId: id,
      token: tokenRealtime,
      aoEvento: receberEvento,
    });

    return () => {
      cancelarLocal();
      cancelarRemoto();
    };
  }, [id, tokenRealtime, exibirRolagem]);

  useEffect(() => {
    if (!id) {
      setErro("Portrait sem personagem selecionado.");
      return undefined;
    }

    let ativo = true;

    const carregarFicha = async () => {
      try {
        const resposta = await fetch(
          `${BASE_URL}?sheet=Fichas&_=${Date.now()}`,
          { cache: "no-store" }
        );
        const fichas = await resposta.json();
        const encontrada = fichas.find((item) => String(item.ID) === String(id));

        if (!ativo) return;
        if (!encontrada) {
          setErro("Personagem não encontrado.");
          return;
        }

        fichaCarregadaRef.current = true;
        setFicha(encontrada);
        setErro("");
      } catch (error) {
        console.error("Erro ao atualizar portrait:", error);
        if (ativo && !fichaCarregadaRef.current) {
          setErro("Não foi possível carregar o portrait.");
        }
      }
    };

    carregarFicha();
    const intervalo = window.setInterval(carregarFicha, 2500);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [id]);

  // A planilha permanece apenas como fallback para outra máquina/navegador.
  useEffect(() => {
    if (!id) return undefined;
    let ativo = true;

    const carregarRolagens = async () => {
      try {
        const resposta = await fetch(
          `${BASE_URL}?sheet=Rolagens&_=${Date.now()}`,
          { cache: "no-store" }
        );
        const todas = await resposta.json();
        const doPersonagem = todas.filter(
          (item) => String(item["ID da Ficha"]) === String(id)
        );
        const ultima = doPersonagem.at(-1);
        if (!ativo || !ultima) return;

        const assinaturaPlanilha = [
          doPersonagem.length,
          ultima.Horario || ultima["Horário"] || "",
          assinaturaRolagem(ultima),
        ].join("|");

        if (primeiraLeituraRolagens.current) {
          primeiraLeituraRolagens.current = false;
          ultimaAssinaturaPlanilhaRef.current = assinaturaPlanilha;
          return;
        }

        if (assinaturaPlanilha === ultimaAssinaturaPlanilhaRef.current) return;
        ultimaAssinaturaPlanilhaRef.current = assinaturaPlanilha;
        exibirRolagem(ultima, "planilha");
      } catch (error) {
        console.error("Erro ao atualizar rolagens do portrait:", error);
      }
    };

    carregarRolagens();
    const intervalo = window.setInterval(carregarRolagens, 1200);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      window.clearTimeout(timerRolagemRef.current);
    };
  }, [id, exibirRolagem]);

  if (erro) {
    return (
      <main className="portrait-page portrait-page-error">
        <div className="portrait-error-card">{erro}</div>
      </main>
    );
  }

  if (!ficha) return <main className="portrait-page" />;

  const nome = ficha["Nome do Personagem"] || "Personagem";
  const imagem = ficha["Imagem do Personagem"] || "";
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  const sucesso = rolagem?.tipoSucesso || "";
  const corSucesso = CORES_SUCESSO[sucesso] || "#ffd43b";
  const ehDano = sucesso === "Dano" || rolagem?.tipo?.toLowerCase().includes("dano");
  const textoResultado = ehDano ? "DANO CAUSADO" : sucesso;

  return (
    <main className="portrait-page">
      <section className={`portrait-hud ${rolagem ? "com-rolagem" : ""}`}>
        <div className="portrait-bars">
          <Barra
            atual={ficha["PV Atual"]}
            maximo={ficha["PV Máx."]}
            classe="vida"
          />
          <Barra
            atual={ficha["Sanidade Atual"]}
            maximo={ficha["Sanidade Máx."]}
            classe="sanidade"
          />
        </div>

        <div className="portrait-avatar-shell">
          {imagem ? (
            <img className="portrait-avatar" src={imagem} alt={nome} />
          ) : (
            <div className="portrait-avatar-placeholder">{iniciais || "?"}</div>
          )}

          <div className="portrait-pe-badge" title="Pontos de Esforço">
            <strong>{numero(ficha["PE Atual"])}</strong>
            <span>PE</span>
          </div>
        </div>

        {rolagem && (
          <aside
            key={rolagem.eventId}
            className={`portrait-roll ${ehDano ? "is-damage" : ""}`}
            style={{ "--success-color": corSucesso }}
          >
            <div className="portrait-roll-info">
              <span>{rolagem.tipo}</span>
              <strong>{rolagem.nome}</strong>
              <em>{textoResultado}</em>
            </div>
            <D20 valor={rolagem.valor} />
          </aside>
        )}
      </section>
    </main>
  );
}
