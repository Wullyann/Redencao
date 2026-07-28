import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Brain,
  ClipboardList,
  Eye,
  EyeOff,
  Heart,
  LogOut,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import RolagensPainel from "../components/RolagensPainel";
import ModalFichaDetalhada from "../components/ModalFichaDetalhada";
import HiddenTestsPanel from "../components/HiddenTestsPanel";
import ThreatManager from "../components/ThreatManager";
import InvestigationAdminPanel from "../components/InvestigationAdminPanel";
import { apiGet, apiPost, clearSession, getStoredUser } from "../utils/api";
import "./EscudoDoMestre.css";

const TABS = [
  ["agentes", "Agentes", Users],
  ["testes", "Testes Ocultos", EyeOff],
  ["ameacas", "Ameaças", ShieldAlert],
  ["investigacoes", "Investigações", ClipboardList],
];

function limitarPorcentagem(atual, maximo) {
  const atualNumero = Number(atual) || 0;
  const maximoNumero = Number(maximo) || 0;
  if (maximoNumero <= 0) return 0;
  return Math.max(0, Math.min((atualNumero / maximoNumero) * 100, 100));
}

function obterIniciais(nome) {
  const palavras = String(nome || "?").trim().split(/\s+/).filter(Boolean);
  if (!palavras.length) return "?";
  return palavras.slice(0, 2).map((palavra) => palavra[0]?.toUpperCase()).join("");
}

function BarraStatus({ tipo, label, atual, maximo, icon: Icon }) {
  const porcentagem = limitarPorcentagem(atual, maximo);
  const atualNumero = Number(atual) || 0;
  const maximoNumero = Number(maximo) || 0;
  return <div className="master-stat"><div className="master-stat__header"><span className={`master-stat__label master-stat__label--${tipo}`}><Icon size={14} strokeWidth={2.4} />{label}</span><strong>{atualNumero}<span>/</span>{maximoNumero}</strong></div><div className="master-stat__track" aria-label={`${label}: ${atualNumero} de ${maximoNumero}`}><div className={`master-stat__fill master-stat__fill--${tipo}`} style={{ width: `${porcentagem}%` }} /></div></div>;
}

function CardAgente({ ficha, pendencias, onOpen, onNexChanged }) {
  const [nex, setNex] = useState(Number(ficha.NEX) || 0);
  const [savingNex, setSavingNex] = useState(false);
  const [maxAdjustments, setMaxAdjustments] = useState({ vida: "", pe: "", sanidade: "" });
  const [savingMaximums, setSavingMaximums] = useState(false);
  const [message, setMessage] = useState("");
  const nome = ficha["Nome do Personagem"] || "Sem nome";
  const imagem = ficha["Imagem do Personagem"] || "";
  const pvAtual = Number(ficha["PV Atual"]) || 0;
  const pvMax = Number(ficha["PV Máx."]) || 0;
  const peAtual = Number(ficha["PE Atual"]) || 0;
  const peMax = Number(ficha["PE Máx."]) || 0;
  const sanAtual = Number(ficha["Sanidade Atual"]) || 0;
  const sanMax = Number(ficha["Sanidade Máx."]) || 0;
  const emRisco = pvMax > 0 && limitarPorcentagem(pvAtual, pvMax) <= 25;
  const atributos = [["AGI", ficha.AGI], ["FOR", ficha.FOR], ["INT", ficha.INT], ["PRE", ficha.PRE], ["VIG", ficha.VIG], ["SOR", ficha.SOR]];

  useEffect(() => setNex(Number(ficha.NEX) || 0), [ficha.NEX]);

  const saveNex = async () => {
    if (Number(nex) === Number(ficha.NEX)) return;
    setSavingNex(true);
    setMessage("");
    try {
      await apiPost("alterarNex", { fichaId: ficha.ID, nexNovo: nex });
      setMessage("NEX atualizado; progressão pendente.");
      onNexChanged();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingNex(false);
    }
  };

  const saveMaximumAdjustments = async () => {
    const vidaDelta = Number(maxAdjustments.vida) || 0;
    const peDelta = Number(maxAdjustments.pe) || 0;
    const sanidadeDelta = Number(maxAdjustments.sanidade) || 0;

    if (!vidaDelta && !peDelta && !sanidadeDelta) {
      setMessage("Informe um valor positivo ou negativo em pelo menos um máximo.");
      return;
    }

    const updates = { ID: ficha.ID };
    if (vidaDelta) updates["PV Máx."] = Math.max(0, pvMax + vidaDelta);
    if (peDelta) updates["PE Máx."] = Math.max(0, peMax + peDelta);
    if (sanidadeDelta) updates["Sanidade Máx."] = Math.max(0, sanMax + sanidadeDelta);

    setSavingMaximums(true);
    setMessage("");
    try {
      await apiPost("salvarFicha", updates);
      setMaxAdjustments({ vida: "", pe: "", sanidade: "" });
      setMessage("Máximos atualizados. Os valores atuais não foram alterados.");
      onNexChanged();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingMaximums(false);
    }
  };

  return <article className={`master-agent-card${emRisco ? " master-agent-card--danger" : ""}`}>
    <div className="master-agent-card__top"><div className="master-agent-card__avatar" aria-hidden="true">{imagem ? <img src={imagem} alt="" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.nextElementSibling.style.display = "grid"; }} /> : null}<span style={{ display: imagem ? "none" : "grid" }}>{obterIniciais(nome)}</span></div><div className="master-agent-card__identity"><div className="master-agent-card__name-row"><h3>{nome}</h3><span className="master-agent-card__nex">NEX {ficha.NEX || 0}%</span></div><p>{ficha.Classe || "Classe desconhecida"}</p>{ficha.Origem ? <small>{ficha.Origem}</small> : null}</div></div>
    <div className="master-agent-card__attributes" aria-label="Atributos">{atributos.map(([sigla, valor]) => <div key={sigla} className="master-attribute"><span>{sigla}</span><strong>{valueOrFive(valor)}</strong></div>)}</div>
    <div className="master-agent-card__stats"><BarraStatus tipo="vida" label="Vida" atual={pvAtual} maximo={pvMax} icon={Heart} /><BarraStatus tipo="sanidade" label="Sanidade" atual={sanAtual} maximo={sanMax} icon={Brain} /><BarraStatus tipo="pe" label="PE" atual={peAtual} maximo={peMax} icon={Sparkles} /></div>

    <div className="master-maximum-control">
      <div className="master-maximum-control__title">
        <strong>Modificar máximos</strong>
        <span>Use valores positivos para acrescentar e negativos para reduzir.</span>
      </div>
      <div className="master-maximum-control__fields">
        <label><span>Vida máxima</span><small>Atual: {pvMax}</small><input type="number" step="1" value={maxAdjustments.vida} onChange={(event) => setMaxAdjustments((current) => ({ ...current, vida: event.target.value }))} placeholder="Ex.: +5 ou -5" /></label>
        <label><span>PE máximo</span><small>Atual: {peMax}</small><input type="number" step="1" value={maxAdjustments.pe} onChange={(event) => setMaxAdjustments((current) => ({ ...current, pe: event.target.value }))} placeholder="Ex.: +2 ou -2" /></label>
        <label><span>Sanidade máxima</span><small>Atual: {sanMax}</small><input type="number" step="1" value={maxAdjustments.sanidade} onChange={(event) => setMaxAdjustments((current) => ({ ...current, sanidade: event.target.value }))} placeholder="Ex.: +5 ou -5" /></label>
      </div>
      <button type="button" onClick={saveMaximumAdjustments} disabled={savingMaximums}>{savingMaximums ? "Salvando..." : "Aplicar modificações"}</button>
    </div>

    <div className="master-nex-control"><label>Alterar NEX<input type="number" min="0" max="100" value={nex} onChange={(event) => setNex(event.target.value)} /></label><button type="button" onClick={saveNex} disabled={savingNex}>{savingNex ? "Salvando" : "Aplicar"}</button></div>
    {pendencias.length ? <div className="master-pending-badge">{pendencias.length} pendência(s) de progressão</div> : null}
    {message ? <small className="master-card-message">{message}</small> : null}
    <button className="master-agent-card__button" onClick={() => onOpen(ficha)}><Eye size={17} /> Abrir ficha</button>
  </article>;
}

function valueOrFive(value) {
  return value === "" || value === null || value === undefined ? 5 : value;
}

export default function EscudoDoMestre() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [activeTab, setActiveTab] = useState("agentes");
  const [fichas, setFichas] = useState([]);
  const [rolagens, setRolagens] = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [fichaSelecionada, setFichaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  useEffect(() => {
    if (!user || user.tipo !== "mestre") navigate("/");
  }, [navigate, user]);

  const carregarDados = async (mostrarIndicador = false) => {
    if (mostrarIndicador) setAtualizando(true);
    try {
      const [responseFichas, responseRolagens, responsePendencias] = await Promise.all([
        apiGet({ acao: "listarFichas" }),
        apiGet({ acao: "listarRolagens" }),
        apiGet({ acao: "listarPendenciasNex" }),
      ]);
      setFichas(responseFichas.fichas || []);
      setRolagens(responseRolagens.rolagens || []);
      setPendencias(responsePendencias.pendencias || []);
      setUltimaAtualizacao(new Date());
      setErro("");
    } catch (error) {
      setErro(error.message || "Não foi possível atualizar o painel agora.");
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  };

  useEffect(() => {
    if (!user || user.tipo !== "mestre") return undefined;
    carregarDados();
    const interval = setInterval(() => activeTab === "agentes" && carregarDados(false), 3500);
    return () => clearInterval(interval);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fichasOrdenadas = useMemo(() => fichas.slice().sort((a, b) => String(a["Nome do Personagem"] || "").localeCompare(String(b["Nome do Personagem"] || ""), "pt-BR")), [fichas]);

  const logout = async () => {
    try { await apiPost("logout"); } catch { /* encerra localmente mesmo assim */ }
    clearSession();
    navigate("/");
  };

  if (loading) return <div className="master-loading"><Shield size={34} /><span>Preparando o Escudo do Mestre...</span></div>;

  return <div className="master-page"><div className="master-container">
    <header className="master-header"><div className="master-header__title"><span className="master-header__icon"><Shield size={28} /></span><div><p>PAINEL DA SESSÃO</p><h1>Escudo do Mestre</h1></div></div><div className="master-header__status"><span className="master-live"><i /> Ao vivo</span><span className="master-header__agents"><Users size={16} /> {fichas.length} agentes</span><button type="button" className={`master-refresh${atualizando ? " master-refresh--active" : ""}`} onClick={() => carregarDados(true)}><RefreshCw size={15} />{ultimaAtualizacao ? ultimaAtualizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}</button><button type="button" className="master-logout" onClick={logout}><LogOut size={16} /> Sair</button></div></header>
    <nav className="master-tabs">{TABS.map(([id, label, Icon]) => <button type="button" key={id} className={activeTab === id ? "is-active" : ""} onClick={() => setActiveTab(id)}><Icon size={17} /> {label}</button>)}</nav>
    {erro ? <div className="master-error">{erro}</div> : null}

    {activeTab === "agentes" ? <div className="master-layout"><main className="master-agents-panel"><div className="master-section-title"><div><Activity size={19} /><h2>Agentes em campo</h2></div><span>{fichas.length} fichas conectadas</span></div>{fichasOrdenadas.length ? <div className="master-agents-grid">{fichasOrdenadas.map((ficha, index) => <CardAgente key={ficha.ID || `${ficha["Nome do Personagem"]}-${index}`} ficha={ficha} pendencias={pendencias.filter((item) => String(item["ID da Ficha"]) === String(ficha.ID) && item.Status === "Pendente")} onOpen={setFichaSelecionada} onNexChanged={() => carregarDados(true)} />)}</div> : <div className="master-empty"><Users size={34} /><h3>Nenhum agente encontrado</h3><p>As fichas aparecerão aqui assim que forem cadastradas.</p></div>}</main><aside className="master-rolls-column"><RolagensPainel rolagens={rolagens} /></aside></div> : null}
    {activeTab === "testes" ? <HiddenTestsPanel fichas={fichas} /> : null}
    {activeTab === "ameacas" ? <ThreatManager /> : null}
    {activeTab === "investigacoes" ? <InvestigationAdminPanel /> : null}
  </div>{fichaSelecionada ? <ModalFichaDetalhada ficha={fichaSelecionada} onClose={() => setFichaSelecionada(null)} /> : null}</div>;
}
