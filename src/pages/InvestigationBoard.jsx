import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArchiveRestore,
  ArrowLeft,
  ChevronDown,
  FileText,
  Filter,
  Flag,
  History,
  Image as ImageIcon,
  Link2,
  List,
  Lock,
  Maximize2,
  MessageSquare,
  MousePointer2,
  Move,
  Plus,
  RefreshCw,
  Save,
  Search,
  Star,
  Trash2,
  Unlock,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { apiGet, apiPost, getStoredUser } from "../utils/api";
import { decodeExternalMedia, encodeExternalMedia, uploadMediaFile } from "../utils/mediaUpload";
import SecureDriveImage from "../components/SecureDriveImage";
import "./InvestigationBoard.css";

const CARD_TYPES = [
  "Pista",
  "Suspeito",
  "Local",
  "Documento",
  "Objeto",
  "Evento",
  "Teoria",
  "Pergunta",
  "Nota livre",
];

const TYPE_ICONS = {
  Documento: FileText,
  Objeto: ImageIcon,
};

const EMPTY_CARD = {
  tipo: "Pista",
  titulo: "",
  conteudo: "",
  visibilidade: "público",
  jogadoresVisiveis: [],
  importante: false,
  bloqueado: false,
  oficialMestre: true,
};

function bool(value) {
  return value === true || value === 1 || String(value).toLowerCase() === "true";
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function objectFile(object, files) {
  const fileId = String(object?.["Arquivo ID"] || "");
  const external = decodeExternalMedia(fileId);
  if (external) return external;
  return files.find((file) => String(file.ID) === fileId || String(file["Objeto ID"]) === String(object?.ID));
}

function SecureInvestigationImage({ file, alt = "" }) {
  return (
    <SecureDriveImage
      file={file}
      alt={alt}
      className="investigation-card__image"
      stateClassName="investigation-card__image-state"
    />
  );
}

function CardPreview({ object, file, commentsCount, onOpen, onPointerDown, onResizeStart, connecting, onConnect }) {
  const Icon = TYPE_ICONS[object.Tipo] || MousePointer2;
  const isLocked = bool(object.Bloqueado);
  const isImportant = bool(object.Importante);
  const isPdf = file?.MIME === "application/pdf";

  return (
    <article
      className={`investigation-card type-${String(object.Tipo || "nota").toLowerCase().replace(/\s+/g, "-")}${isImportant ? " is-important" : ""}${isLocked ? " is-locked" : ""}`}
      style={{
        left: number(object.X, 80),
        top: number(object.Y, 80),
        width: number(object.Largura, 320),
        height: number(object.Altura, 220),
      }}
      onPointerDown={(event) => onPointerDown(event, object)}
      onDoubleClick={() => onOpen(object)}
    >
      <header>
        <span className="investigation-card__type"><Icon size={14} /> {object.Tipo}</span>
        <span className="investigation-card__badges">
          {isImportant ? <Star size={14} fill="currentColor" /> : null}
          {isLocked ? <Lock size={13} /> : null}
        </span>
      </header>
      <h3>{object["Título"] || "Sem título"}</h3>
      {file && !isPdf ? <SecureInvestigationImage file={file} alt={object["Título"] || "Imagem do cartão"} /> : null}
      {isPdf ? <a className="investigation-card__pdf" href={file.URL} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()}><FileText size={18} /> Abrir PDF</a> : null}
      <p>{object["Conteúdo"] || "Sem descrição."}</p>
      <footer>
        <span><MessageSquare size={13} /> {commentsCount}</span>
        <span>{object["Atualizado Por"] || object["Criado Por"]}</span>
        {connecting ? (
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onConnect(object)}>
            <Link2 size={14} /> Conectar
          </button>
        ) : null}
      </footer>
      {!isLocked ? (
        <button
          type="button"
          className="investigation-card__resize"
          aria-label="Redimensionar cartão"
          onPointerDown={(event) => onResizeStart(event, object)}
        ><Maximize2 size={14} /></button>
      ) : null}
    </article>
  );
}

export default function InvestigationBoard() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const isMaster = user?.tipo === "mestre";
  const stageRef = useRef(null);
  const interactionRef = useRef(null);
  const fileInputRef = useRef(null);
  const [investigations, setInvestigations] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [investigationId, setInvestigationId] = useState("");
  const [data, setData] = useState({ objetos: [], conexoes: [], comentarios: [], arquivos: [], historico: [] });
  const [view, setView] = useState("board");
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [importantOnly, setImportantOnly] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(EMPTY_CARD);
  const [newComment, setNewComment] = useState("");
  const [connectionSource, setConnectionSource] = useState(null);
  const [connectionStyle, setConnectionStyle] = useState("contínua");
  const [connectionText, setConnectionText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const dataRef = useRef(data);
  const boardRequestSeqRef = useRef(0);
  const positionGuardsRef = useRef(new Map());

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const loadInvestigations = useCallback(async () => {
    const response = await apiGet({ acao: "listarInvestigacoes" });
    const list = response.investigacoes || [];
    setInvestigations(list);
    setInvestigationId((current) => current || String(list[0]?.ID || ""));
  }, []);

  const loadBoard = useCallback(async (silent = false) => {
    if (!investigationId) return;
    const requestId = ++boardRequestSeqRef.current;
    if (!silent) setLoading(true);
    try {
      const response = await apiGet({
        acao: "obterInvestigacao",
        investigacaoId: investigationId,
        incluirLixeira: isMaster && showTrash,
      });

      // Descarta respostas de sincronizações antigas que chegaram fora de ordem.
      if (requestId !== boardRequestSeqRef.current) return;

      if (!interactionRef.current) {
        setData((current) => {
          const now = Date.now();
          const guards = positionGuardsRef.current;
          const receivedObjects = response.objetos || [];
          const mergedObjects = receivedObjects.map((serverObject) => {
            const id = String(serverObject.ID);
            const guard = guards.get(id);
            if (!guard) return serverObject;
            if (guard.expiresAt <= now) {
              guards.delete(id);
              return serverObject;
            }

            const serverVersion = number(serverObject["Versão"], 0);
            const hasSavedVersion = guard.minVersion !== null && guard.minVersion > 0 && serverVersion >= guard.minVersion;
            const samePosition = ["X", "Y", "Largura", "Altura"].every(
              (field) => number(serverObject[field]) === number(guard.position[field])
            );

            if (hasSavedVersion || samePosition) {
              guards.delete(id);
              return serverObject;
            }

            // Mantém a posição otimista enquanto o Google Apps Script ainda
            // devolve uma leitura antiga da planilha.
            return { ...serverObject, ...guard.position };
          });

          // Uma leitura antiga pode nem conter um objeto recém-alterado.
          guards.forEach((guard, id) => {
            if (guard.expiresAt <= now || mergedObjects.some((item) => String(item.ID) === id)) return;
            const localObject = current.objetos.find((item) => String(item.ID) === id);
            if (localObject) mergedObjects.push({ ...localObject, ...guard.position });
          });

          const next = {
            objetos: mergedObjects,
            conexoes: response.conexoes || [],
            comentarios: response.comentarios || [],
            arquivos: response.arquivos || [],
            historico: response.historico || [],
          };
          dataRef.current = next;
          return next;
        });
      }
      setLastSync(new Date());
      setMessage("");
    } catch (error) {
      if (requestId === boardRequestSeqRef.current) setMessage(error.message);
    } finally {
      if (!silent && requestId === boardRequestSeqRef.current) setLoading(false);
    }
  }, [investigationId, isMaster, showTrash]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadInvestigations().catch((error) => setMessage(error.message));
  }, [loadInvestigations, navigate, user]);

  useEffect(() => {
    if (!isMaster) return undefined;
    let active = true;
    apiGet({ acao: "listarFichas" })
      .then((response) => {
        if (!active) return;
        const unique = new Map();
        (response.fichas || []).forEach((ficha) => {
          const login = String(ficha["Login do Jogador"] || "").trim();
          if (login && !unique.has(login.toLowerCase())) {
            unique.set(login.toLowerCase(), { login, nome: ficha["Nome do Personagem"] || login });
          }
        });
        setAvailablePlayers([...unique.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      })
      .catch((error) => setMessage(error.message));
    return () => { active = false; };
  }, [isMaster]);

  useEffect(() => {
    if (!investigationId) return undefined;
    loadBoard();
    const interval = window.setInterval(() => loadBoard(true), 4000);
    return () => window.clearInterval(interval);
  }, [investigationId, loadBoard]);

  const visibleObjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return data.objetos.filter((object) => {
      const matchesSearch = !normalizedSearch || `${object["Título"] || ""} ${object["Conteúdo"] || ""}`.toLowerCase().includes(normalizedSearch);
      const matchesType = typeFilter === "Todos" || object.Tipo === typeFilter;
      const matchesImportant = !importantOnly || bool(object.Importante);
      return matchesSearch && matchesType && matchesImportant;
    });
  }, [data.objetos, search, typeFilter, importantOnly]);

  const objectMap = useMemo(() => new Map(data.objetos.map((object) => [String(object.ID), object])), [data.objetos]);

  const updateLocalObject = useCallback((id, updates) => {
    setData((current) => {
      const next = {
        ...current,
        objetos: current.objetos.map((object) => String(object.ID) === String(id) ? { ...object, ...updates } : object),
      };
      dataRef.current = next;
      return next;
    });
  }, []);

  const persistPosition = useCallback(async (object) => {
    const id = String(object.ID);
    const position = {
      X: number(object.X),
      Y: number(object.Y),
      Largura: number(object.Largura, 320),
      Altura: number(object.Altura, 220),
    };

    const previousGuard = positionGuardsRef.current.get(id);
    positionGuardsRef.current.set(id, {
      position,
      minVersion: previousGuard?.minVersion ?? null,
      expiresAt: Date.now() + 20000,
    });

    try {
      const response = await apiPost("moverObjetoInvestigacao", {
        id: object.ID,
        x: position.X,
        y: position.Y,
        largura: position.Largura,
        altura: position.Altura,
      });
      if (response.objeto) {
        const savedPosition = {
          X: number(response.objeto.X, position.X),
          Y: number(response.objeto.Y, position.Y),
          Largura: number(response.objeto.Largura, position.Largura),
          Altura: number(response.objeto.Altura, position.Altura),
        };
        positionGuardsRef.current.set(id, {
          position: savedPosition,
          minVersion: number(response.objeto["Versão"], 0),
          expiresAt: Date.now() + 16000,
        });
        updateLocalObject(object.ID, response.objeto);
      }
    } catch (error) {
      positionGuardsRef.current.delete(id);
      setMessage(error.message);
      loadBoard(true);
    }
  }, [loadBoard, updateLocalObject]);

  const startCardDrag = (event, object) => {
    if (event.button !== 0 || event.target.closest("button,a,input,textarea,select")) return;
    if (bool(object.Bloqueado)) return;
    event.preventDefault();
    event.stopPropagation();
    const start = { x: event.clientX, y: event.clientY, object: { ...object } };
    interactionRef.current = { type: "drag", ...start };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const startResize = (event, object) => {
    event.preventDefault();
    event.stopPropagation();
    interactionRef.current = { type: "resize", x: event.clientX, y: event.clientY, object: { ...object } };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const interaction = interactionRef.current;
    if (!interaction) return;
    if (interaction.type === "pan") {
      setPan({ x: interaction.pan.x + event.clientX - interaction.x, y: interaction.pan.y + event.clientY - interaction.y });
      return;
    }
    const dx = (event.clientX - interaction.x) / zoom;
    const dy = (event.clientY - interaction.y) / zoom;
    if (interaction.type === "drag") {
      const updates = {
        X: Math.round(number(interaction.object.X) + dx),
        Y: Math.round(number(interaction.object.Y) + dy),
      };
      interaction.latest = { ...interaction.object, ...updates };
      updateLocalObject(interaction.object.ID, updates);
    } else if (interaction.type === "resize") {
      const updates = {
        Largura: Math.max(220, Math.round(number(interaction.object.Largura, 320) + dx)),
        Altura: Math.max(150, Math.round(number(interaction.object.Altura, 220) + dy)),
      };
      interaction.latest = { ...interaction.object, ...updates };
      updateLocalObject(interaction.object.ID, updates);
    }
  };

  const finishInteraction = () => {
    const interaction = interactionRef.current;
    if (!interaction) return;
    interactionRef.current = null;
    if (interaction.type === "drag" || interaction.type === "resize") {
      const object = interaction.latest
        || dataRef.current.objetos.find((item) => String(item.ID) === String(interaction.object.ID));
      if (object) {
        const position = {
          X: number(object.X),
          Y: number(object.Y),
          Largura: number(object.Largura, 320),
          Altura: number(object.Altura, 220),
        };
        positionGuardsRef.current.set(String(object.ID), {
          position,
          minVersion: null,
          expiresAt: Date.now() + 20000,
        });
        persistPosition({ ...object, ...position });
      }
    }
  };

  const startPan = (event) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    interactionRef.current = { type: "pan", x: event.clientX, y: event.clientY, pan: { ...pan } };
  };

  const openCard = (object) => {
    setSelected(object);
    setDraft({
      id: object.ID,
      tipo: object.Tipo || "Pista",
      titulo: object["Título"] || "",
      conteudo: object["Conteúdo"] || "",
      visibilidade: object.Visibilidade || "público",
      jogadoresVisiveis: (() => { try { return JSON.parse(object["Jogadores Visíveis JSON"] || "[]"); } catch { return []; } })(),
      importante: bool(object.Importante),
      bloqueado: bool(object.Bloqueado),
      oficialMestre: bool(object["Oficial do Mestre"]),
      arquivoId: object["Arquivo ID"] || "",
    });
  };

  const createCard = () => {
    setSelected({ ID: null });
    setDraft({ ...EMPTY_CARD, oficialMestre: isMaster, bloqueado: isMaster });
  };

  const saveCard = async () => {
    if (!draft.titulo.trim()) {
      setMessage("Dê um título ao cartão.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiPost("salvarObjetoInvestigacao", {
        objeto: {
          id: draft.id,
          investigacaoId: investigationId,
          tipo: draft.tipo,
          titulo: draft.titulo,
          conteudo: draft.conteudo,
          visibilidade: draft.visibilidade,
          jogadoresVisiveis: draft.jogadoresVisiveis,
          importante: draft.importante,
          bloqueado: draft.bloqueado,
          oficialMestre: draft.oficialMestre,
          arquivoId: draft.arquivoId,
          x: selected?.X ?? 120 + Math.round(Math.random() * 300),
          y: selected?.Y ?? 120 + Math.round(Math.random() * 200),
          largura: selected?.Largura ?? 320,
          altura: selected?.Altura ?? 220,
        },
      });
      if (response.objeto) {
        setData((current) => ({
          ...current,
          objetos: current.objetos.some((object) => String(object.ID) === String(response.objeto.ID))
            ? current.objetos.map((object) => String(object.ID) === String(response.objeto.ID) ? response.objeto : object)
            : [...current.objetos, response.objeto],
        }));
      }
      setSelected(null);
      setMessage("Cartão salvo.");
      loadBoard(true);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const sendToTrash = async (object) => {
    try {
      await apiPost("lixeiraObjetoInvestigacao", { id: object.ID });
      setSelected(null);
      loadBoard();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const restoreObject = async (object) => {
    await apiPost("restaurarObjetoInvestigacao", { id: object.ID });
    loadBoard();
  };

  const deletePermanently = async (object) => {
    if (!window.confirm(`Excluir definitivamente “${object["Título"]}”?`)) return;
    await apiPost("excluirDefinitivoObjetoInvestigacao", { id: object.ID });
    loadBoard();
  };

  const addComment = async () => {
    if (!selected?.ID || !newComment.trim()) return;
    try {
      const response = await apiPost("salvarComentarioInvestigacao", { objetoId: selected.ID, comentario: newComment });
      setData((current) => ({ ...current, comentarios: [...current.comentarios, response.comentario] }));
      setNewComment("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const startConnection = (object) => {
    setConnectionSource(object);
    setSelected(null);
    setMessage(`Selecione o cartão de destino para conectar “${object["Título"]}”.`);
  };

  const finishConnection = async (target) => {
    if (!connectionSource || String(connectionSource.ID) === String(target.ID)) return;
    try {
      const response = await apiPost("salvarConexaoInvestigacao", {
        conexao: {
          origemId: connectionSource.ID,
          destinoId: target.ID,
          texto: connectionText,
          estilo: connectionStyle,
        },
      });
      setData((current) => ({ ...current, conexoes: [...current.conexoes, response.conexao] }));
      setConnectionSource(null);
      setConnectionText("");
      setMessage("Conexão criada.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const uploadFile = async (file, attachObject = null) => {
    if (!file) return;
    setSaving(true);
    try {
      const uploaded = await uploadMediaFile(file, {
        fileName: file.name || `imagem-colada-${Date.now()}.png`,
      });
      const externalMediaId = encodeExternalMedia(uploaded);

      if (attachObject) {
        setDraft((current) => ({ ...current, arquivoId: externalMediaId }));
      } else {
        setSelected({ ID: null });
        setDraft({
          ...EMPTY_CARD,
          tipo: "Pista",
          titulo: uploaded.name,
          arquivoId: externalMediaId,
          oficialMestre: isMaster,
          bloqueado: isMaster,
        });
      }
      setMessage("Arquivo enviado. Salve o cartão para confirmar.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handlePaste = (event) => {
      const image = Array.from(event.clipboardData?.items || []).find((item) => item.type.startsWith("image/"));
      if (!image) return;
      event.preventDefault();
      const file = image.getAsFile();
      if (file) uploadFile(new File([file], `imagem-colada-${Date.now()}.png`, { type: file.type }));
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [investigationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedComments = selected?.ID
    ? data.comentarios.filter((comment) => String(comment["Objeto ID"]) === String(selected.ID))
    : [];

  const selectedFile = selected?.ID
    ? objectFile({ ...selected, "Arquivo ID": draft.arquivoId || selected["Arquivo ID"] }, data.arquivos)
    : objectFile({ ID: "", "Arquivo ID": draft.arquivoId }, data.arquivos);
  const selectedIsLockedOfficial = Boolean(selected?.ID)
    && bool(selected?.["Oficial do Mestre"])
    && bool(selected?.Bloqueado);
  const canEditSelected = !selected?.ID || isMaster || !selectedIsLockedOfficial;
  const selectedCreator = String(selected?.["Criado Por"] || "").trim().toLowerCase();
  const canTrashSelected = isMaster || [user?.nome, user?.usuario]
    .map((value) => String(value || "").trim().toLowerCase())
    .includes(selectedCreator);

  return (
    <main className="investigation-page" onPointerMove={handlePointerMove} onPointerUp={finishInteraction} onPointerCancel={finishInteraction}>
      <header className="investigation-header">
        <button type="button" className="investigation-back" onClick={() => navigate(isMaster ? "/escudo" : "/ficha")}><ArrowLeft size={18} /> Voltar</button>
        <div>
          <span>REDE DE EVIDÊNCIAS</span>
          <h1>Quadro de Investigação</h1>
        </div>
        <div className="investigation-header__status"><RefreshCw size={15} /> {lastSync ? `Sincronizado ${lastSync.toLocaleTimeString("pt-BR")}` : "Conectando"}</div>
      </header>

      <section className="investigation-toolbar">
        <label className="investigation-select">
          <select value={investigationId} onChange={(event) => setInvestigationId(event.target.value)}>
            {investigations.map((item) => <option key={item.ID} value={item.ID}>{item.Nome}</option>)}
          </select><ChevronDown size={15} />
        </label>
        <label className="investigation-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar cartões..." /></label>
        <label className="investigation-select"><Filter size={15} /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>Todos</option>{CARD_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        <button type="button" className={importantOnly ? "is-active" : ""} onClick={() => setImportantOnly((value) => !value)}><Flag size={16} /> Importantes</button>
        <div className="investigation-view-toggle"><button type="button" className={view === "board" ? "is-active" : ""} onClick={() => setView("board")}><Move size={16} /> Quadro</button><button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}><List size={16} /> Lista</button></div>
        <button type="button" onClick={createCard}><Plus size={16} /> Novo cartão</button>
        <button type="button" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Anexar</button>
        <input ref={fileInputRef} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadFile(event.target.files?.[0])} />
        {isMaster ? <button type="button" className={showTrash ? "is-active" : ""} onClick={() => setShowTrash((value) => !value)}><Trash2 size={16} /> Lixeira</button> : null}
        {isMaster ? <button type="button" className={showHistory ? "is-active" : ""} onClick={() => setShowHistory((value) => !value)}><History size={16} /> Histórico</button> : null}
      </section>

      {connectionSource ? (
        <section className="investigation-connection-bar">
          <Link2 size={17} /> <strong>Conectando:</strong> {connectionSource["Título"]}
          <input value={connectionText} onChange={(event) => setConnectionText(event.target.value)} placeholder="Texto da seta" />
          <select value={connectionStyle} onChange={(event) => setConnectionStyle(event.target.value)}><option value="contínua">Linha contínua</option><option value="tracejada">Linha tracejada</option></select>
          <button type="button" onClick={() => setConnectionSource(null)}>Cancelar</button>
        </section>
      ) : null}

      {message ? <div className="investigation-message">{message}</div> : null}

      {loading ? <div className="investigation-loading">Carregando mural...</div> : view === "board" ? (
        <section className="investigation-board-shell">
          <div className="investigation-zoom"><button type="button" onClick={() => setZoom((value) => Math.max(0.35, value - 0.1))}><ZoomOut size={17} /></button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))}><ZoomIn size={17} /></button></div>
          <div ref={stageRef} className="investigation-viewport" onPointerDown={startPan} onWheel={(event) => { event.preventDefault(); setZoom((value) => Math.max(0.35, Math.min(1.8, value - Math.sign(event.deltaY) * 0.08))); }}>
            <div className="investigation-stage" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
              <svg className="investigation-connections" width="4000" height="2800" viewBox="0 0 4000 2800">
                <defs><marker id="investigation-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" /></marker></defs>
                {data.conexoes.map((connection) => {
                  const source = objectMap.get(String(connection["Origem ID"]));
                  const target = objectMap.get(String(connection["Destino ID"]));
                  if (!source || !target) return null;
                  const x1 = number(source.X) + number(source.Largura, 320) / 2;
                  const y1 = number(source.Y) + number(source.Altura, 220) / 2;
                  const x2 = number(target.X) + number(target.Largura, 320) / 2;
                  const y2 = number(target.Y) + number(target.Altura, 220) / 2;
                  return <g key={connection.ID}><line x1={x1} y1={y1} x2={x2} y2={y2} className={connection.Estilo === "tracejada" ? "is-dashed" : ""} markerEnd="url(#investigation-arrow)" /><text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8}>{connection.Texto}</text></g>;
                })}
              </svg>
              {visibleObjects.map((object) => (
                <CardPreview
                  key={object.ID}
                  object={object}
                  file={objectFile(object, data.arquivos)}
                  commentsCount={data.comentarios.filter((comment) => String(comment["Objeto ID"]) === String(object.ID)).length}
                  onOpen={openCard}
                  onPointerDown={startCardDrag}
                  onResizeStart={startResize}
                  connecting={Boolean(connectionSource)}
                  onConnect={finishConnection}
                />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="investigation-list">
          {visibleObjects.map((object) => {
            const file = objectFile(object, data.arquivos);
            return <article key={object.ID} onClick={() => openCard(object)}><span>{object.Tipo}</span><div><h3>{object["Título"]}</h3><p>{object["Conteúdo"]}</p></div>{file ? <a href={file.URL} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>{file.MIME === "application/pdf" ? "Abrir PDF" : "Abrir imagem"}</a> : null}{bool(object.Importante) ? <Star size={17} /> : null}</article>;
          })}
        </section>
      )}

      {selected ? (
        <div className="investigation-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="investigation-modal">
            <header><div><span>{selected.ID ? "EDITAR CARTÃO" : "NOVO CARTÃO"}</span><h2>{draft.titulo || "Novo cartão"}</h2></div><button type="button" onClick={() => setSelected(null)}>×</button></header>
            <div className="investigation-modal__grid">
              <div className="investigation-form">
                {selectedIsLockedOfficial && !isMaster ? <div className="investigation-locked-note"><Lock size={15} /> Cartão oficial bloqueado: você pode comentar e criar conexões.</div> : null}
                <label>Tipo<select disabled={!canEditSelected} value={draft.tipo} onChange={(event) => setDraft((current) => ({ ...current, tipo: event.target.value }))}>{CARD_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
                <label>Título<input disabled={!canEditSelected} value={draft.titulo} onChange={(event) => setDraft((current) => ({ ...current, titulo: event.target.value }))} /></label>
                <label>Conteúdo<textarea disabled={!canEditSelected} rows={8} value={draft.conteudo} onChange={(event) => setDraft((current) => ({ ...current, conteudo: event.target.value }))} /></label>
                {isMaster ? <label>Visibilidade<select value={draft.visibilidade} onChange={(event) => setDraft((current) => ({ ...current, visibilidade: event.target.value }))}><option value="público">Público</option><option value="somente mestre">Somente mestre</option><option value="jogadores selecionados">Jogadores selecionados</option></select></label> : null}
                {isMaster && draft.visibilidade === "jogadores selecionados" ? <fieldset className="investigation-player-permissions"><legend>Jogadores permitidos</legend>{availablePlayers.length ? availablePlayers.map((player) => <label key={player.login}><input type="checkbox" checked={draft.jogadoresVisiveis.includes(player.login)} onChange={(event) => setDraft((current) => ({ ...current, jogadoresVisiveis: event.target.checked ? [...new Set([...current.jogadoresVisiveis, player.login])] : current.jogadoresVisiveis.filter((item) => item !== player.login) }))} /><span>{player.nome}</span><small>{player.login}</small></label>) : <small>Nenhum jogador com ficha foi encontrado.</small>}</fieldset> : null}
                <div className="investigation-checks"><label><input type="checkbox" disabled={!canEditSelected} checked={draft.importante} onChange={(event) => setDraft((current) => ({ ...current, importante: event.target.checked }))} /> <Star size={15} /> Importante</label>{isMaster ? <label><input type="checkbox" checked={draft.bloqueado} onChange={(event) => setDraft((current) => ({ ...current, bloqueado: event.target.checked }))} /> {draft.bloqueado ? <Lock size={15} /> : <Unlock size={15} />} Bloqueado</label> : null}</div>
                {selectedFile ? <div className="investigation-attachment"><strong>{selectedFile.Nome}</strong><a href={selectedFile.URL} target="_blank" rel="noreferrer">Abrir anexo</a></div> : null}
                <div className="investigation-modal__actions">{canEditSelected ? <button type="button" onClick={saveCard} disabled={saving}><Save size={16} /> {saving ? "Salvando..." : "Salvar"}</button> : null}{selected.ID ? <button type="button" onClick={() => startConnection(selected)}><Link2 size={16} /> Conectar</button> : null}{selected.ID && canTrashSelected && !bool(selected["Excluído"]) ? <button type="button" className="danger" onClick={() => sendToTrash(selected)}><Trash2 size={16} /> Lixeira</button> : null}{isMaster && bool(selected["Excluído"]) ? <><button type="button" onClick={() => restoreObject(selected)}><ArchiveRestore size={16} /> Restaurar</button><button type="button" className="danger" onClick={() => deletePermanently(selected)}>Excluir definitivamente</button></> : null}</div>
              </div>
              {selected.ID ? <aside className="investigation-comments"><h3><MessageSquare size={17} /> Comentários</h3><div>{selectedComments.map((comment) => <article key={comment.ID}><strong>{comment.Autor}</strong><span>{new Date(comment.Data).toLocaleString("pt-BR")}</span><p>{comment.Comentário}</p></article>)}</div><textarea rows={3} value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Escreva um comentário..." /><button type="button" onClick={addComment}>Comentar</button></aside> : null}
            </div>
          </section>
        </div>
      ) : null}

      {isMaster && showHistory ? <aside className="investigation-history"><header><h2><History size={18} /> Histórico</h2><button type="button" onClick={() => setShowHistory(false)}>×</button></header>{data.historico.map((entry) => <article key={entry.ID}><strong>{entry["Ação"]}</strong><span>{entry.Autor} · {new Date(entry.Data).toLocaleString("pt-BR")}</span><p>{entry.Resumo}</p></article>)}</aside> : null}
    </main>
  );
}
