import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Backpack,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  History,
  LayoutDashboard,
  LogOut,
  Save,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
} from "lucide-react";
import { FaDiceD20 } from "react-icons/fa";
import CharacterHeader from "../components/CharacterHeader";
import VitalStatsSection from "../components/VitalStatsSection";
import PericiasSection from "../components/PericiasSection";
import RituaisSection from "../components/RituaisSection";
import CombatEntryForm from "../components/CombatEntryForm";
import HabilidadesSection from "../components/HabilidadesSection";
import RolagensSection from "../components/RolagensSection";
import InventarioSection from "../components/InventarioSection";
import CarteiraSection from "../components/CarteiraSection";
import {
  getNivel,
  getLimiteBonusPorNivel,
  getPontosPericiaTotal,
  getPV,
  getPE,
  getSAN,
} from "../utils/calculosPorClasse";
import {
  conectarCanalPortraitRemoto,
  obterTokenPortrait,
  publicarRolagemPortrait,
  publicarStatusPortrait,
} from "../utils/portraitRealtime";
import { apiGet, apiPost, clearSession, getStoredUser } from "../utils/api";
import { ATRIBUTOS, ATTRIBUTE_BASE, categorize } from "../utils/systemRules";
import "./FichaJogador.css";

const ATRIBUTO_NOMES = {
  AGI: "Agilidade",
  FOR: "Força",
  INT: "Intelecto",
  PRE: "Presença",
  VIG: "Vigor",
  SOR: "Sorte",
};
const MAX_REDUCTION = 6;

const MODULES = [
  { id: "Combate", label: "Combate", subtitle: "Ataques e equipamentos", icon: Swords },
  { id: "Habilidades", label: "Habilidades", subtitle: "Poderes e características", icon: Sparkles },
  { id: "Rituais", label: "Rituais", subtitle: "Conhecimento paranormal", icon: ScrollText },
  { id: "Inventário", label: "Inventário", subtitle: "Itens e carga", icon: Backpack },
  { id: "Rolagens", label: "Rolagens", subtitle: "Histórico da sessão", icon: History },
  { id: "Carteira", label: "Carteira", subtitle: "Recursos e valores", icon: CircleDollarSign },
];

const categoryStyles = {
  Desastre: { color: "#ff3b5c", textShadow: "0 0 18px rgba(255,59,92,.75)" },
  Fracasso: { color: "#ff6b6b", textShadow: "0 0 12px rgba(255,107,107,.35)" },
  Sucesso: { color: "#55e98f", textShadow: "0 0 14px rgba(85,233,143,.4)" },
  "Sucesso Bom": { color: "#5de1ff", textShadow: "0 0 14px rgba(93,225,255,.45)" },
  "Sucesso Extremo": { color: "#f7fbff", textShadow: "0 0 15px rgba(93,225,255,.6)" },
  "Sucesso Perfeito": { color: "#f7c948", textShadow: "0 0 18px rgba(247,201,72,.65)" },
};

export default function FichaJogador() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ficha, setFicha] = useState(null);
  const [pendencias, setPendencias] = useState([]);
  const [bonusManual, setBonusManual] = useState({});
  const [pvAtual, setPvAtual] = useState(0);
  const [peAtual, setPeAtual] = useState(0);
  const [sanAtual, setSanAtual] = useState(0);
  const [pvMax, setPvMax] = useState(0);
  const [peMax, setPeMax] = useState(0);
  const [sanMax, setSanMax] = useState(0);
  const [erroAtributos, setErroAtributos] = useState("");
  const [rollAttr, setRollAttr] = useState(null);
  const [historicoRolagens, setHistoricoRolagens] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [statusAlterado, setStatusAlterado] = useState(false);
  const [imagemUrl, setImagemUrl] = useState("");
  const [activeModule, setActiveModule] = useState("Combate");
  const [saveState, setSaveState] = useState({ type: "idle", message: "" });
  const [usuarioAtual] = useState(() => getStoredUser());
  const isMestre = usuarioAtual?.tipo === "mestre";
  const nivel = ficha ? getNivel(ficha.NEX) : 1;

  const carregarFicha = useCallback(async () => {
    if (!usuarioAtual) {
      navigate("/");
      return;
    }
    try {
      const [responseFichas, responsePendencias] = await Promise.all([
        apiGet({ acao: "listarFichas" }),
        apiGet({ acao: "listarPendenciasNex" }),
      ]);
      const list = responseFichas.fichas || [];
      const idFromUrl = searchParams.get("id");
      let found;
      if (idFromUrl && isMestre) {
        found = list.find((item) => String(item.ID) === String(idFromUrl));
      } else {
        found = list.find((item) =>
          String(item["Login do Jogador"] || "").toLowerCase() === String(usuarioAtual.usuario || "").toLowerCase()
        );
      }
      if (!found) {
        navigate(isMestre ? "/painel" : "/");
        return;
      }
      const normalized = { ...found };
      ATRIBUTOS.forEach((attribute) => {
        if (normalized[attribute] === "" || normalized[attribute] === null || normalized[attribute] === undefined) {
          normalized[attribute] = ATTRIBUTE_BASE;
        }
      });
      setFicha(normalized);
      setImagemUrl(normalized["Imagem do Personagem"] || "");
      setPendencias((responsePendencias.pendencias || []).filter((item) => String(item["ID da Ficha"]) === String(normalized.ID) && item.Status === "Pendente"));
      const bonus = {};
      Object.keys(normalized).forEach((key) => {
        if (key.startsWith("Bonus_")) bonus[key.replace("Bonus_", "")] = normalized[key];
      });
      setBonusManual(bonus);
      const portraitToken = obterTokenPortrait(normalized.ID);
      apiPost("registrarTokenPortrait", { fichaId: normalized.ID, portraitToken }).catch(console.error);
    } catch (error) {
      console.error(error);
      navigate("/");
    }
  }, [isMestre, navigate, searchParams, usuarioAtual]);

  useEffect(() => { carregarFicha(); }, [carregarFicha]);

  useEffect(() => {
    if (!ficha) return;
    const modPV = Number(ficha["Mod. PV Máx."]) || 0;
    const modPE = Number(ficha["Mod. PE Máx."]) || 0;
    const modSAN = Number(ficha["Mod. SAN Máx."]) || 0;
    const newPvMax = getPV(ficha.Classe, Number(ficha.VIG) || ATTRIBUTE_BASE, nivel) + modPV;
    const newPeMax = getPE(ficha.Classe, Number(ficha.PRE) || ATTRIBUTE_BASE, nivel) + modPE;
    const newSanMax = getSAN(ficha.Classe, nivel) + modSAN;
    const parseOr = (value, fallback) => value === "" || value === null || value === undefined || Number.isNaN(Number(value)) ? fallback : Number(value);
    setPvMax(newPvMax);
    setPeMax(newPeMax);
    setSanMax(newSanMax);
    setPvAtual(parseOr(ficha["PV Atual"], newPvMax));
    setPeAtual(parseOr(ficha["PE Atual"], newPeMax));
    setSanAtual(parseOr(ficha["Sanidade Atual"], newSanMax));
  }, [ficha?.ID, ficha?.Classe, ficha?.VIG, ficha?.PRE, ficha?.["Mod. PV Máx."], ficha?.["Mod. PE Máx."], ficha?.["Mod. SAN Máx."], nivel]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  useEffect(() => {
    if (!ficha?.ID) return undefined;
    const token = obterTokenPortrait(ficha.ID);
    return conectarCanalPortraitRemoto({ fichaId: ficha.ID, token });
  }, [ficha?.ID]);

  useEffect(() => {
    if (!ficha?.ID) return;
    publicarStatusPortrait({ fichaId: ficha.ID, pvAtual, pvMax, sanAtual, sanMax, peAtual, peMax });
  }, [ficha?.ID, pvAtual, pvMax, sanAtual, sanMax, peAtual, peMax]);

  useEffect(() => {
    if (!statusAlterado || !ficha?.ID) return undefined;
    const timer = window.setTimeout(() => {
      apiPost("salvarFicha", {
        ID: ficha.ID,
        "PV Atual": pvAtual,
        "PE Atual": peAtual,
        "Sanidade Atual": sanAtual,
        "PV Máx.": pvMax,
        "PE Máx.": peMax,
        "Sanidade Máx.": sanMax,
      }).catch(console.error);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [statusAlterado, ficha?.ID, pvAtual, peAtual, sanAtual, pvMax, peMax, sanMax]);

  const atributosNum = useMemo(() => ATRIBUTOS.reduce((result, key) => ({
    ...result,
    [key]: ficha?.[key] === "" || ficha?.[key] === null || ficha?.[key] === undefined ? ATTRIBUTE_BASE : Number(ficha[key]),
  }), {}), [ficha]);

  const salvarFicha = useCallback(async () => {
    if (!ficha || saveState.type === "saving") return;
    setSaveState({ type: "saving", message: "Salvando alterações..." });
    const payload = {
      ID: ficha.ID,
      "Imagem do Personagem": imagemUrl,
      Classe: ficha.Classe,
      "PV Atual": pvAtual,
      "PE Atual": peAtual,
      "Sanidade Atual": sanAtual,
      "PV Máx.": pvMax,
      "PE Máx.": peMax,
      "Sanidade Máx.": sanMax,
      RD: Number(ficha.RD) || 0,
      "Observação da RD": ficha["Observação da RD"] || "",
      "Token Portrait": obterTokenPortrait(ficha.ID),
    };
    ATRIBUTOS.forEach((attribute) => { payload[attribute] = ficha[attribute]; });
    Object.entries(bonusManual).forEach(([name, value]) => { payload[`Bonus_${name}`] = value; });
    try {
      await apiPost("salvarFicha", payload);
      setHasChanges(false);
      setStatusAlterado(false);
      setSaveState({ type: "success", message: "Ficha salva com sucesso." });
      window.setTimeout(() => setSaveState({ type: "idle", message: "" }), 2600);
    } catch (error) {
      setSaveState({ type: "error", message: error.message || "Não foi possível salvar a ficha." });
    }
  }, [ficha, imagemUrl, pvAtual, peAtual, sanAtual, pvMax, peMax, sanMax, bonusManual, saveState.type]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        salvarFicha();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [salvarFicha]);

  if (!ficha) return <div className="play-loading"><div className="play-loading-mark"><Shield size={30} /></div><div><strong>Abrindo ficha operacional</strong><span>Sincronizando os dados do personagem...</span></div></div>;

  const sor = Number(ficha.SOR) || ATTRIBUTE_BASE;
  const totalPoints = ATRIBUTOS.length * ATTRIBUTE_BASE + 20 + Math.max(0, nivel - 1);
  const pontosPericia = getPontosPericiaTotal(ficha.Classe, atributosNum.INT, nivel);
  const limitePorPericia = getLimiteBonusPorNivel(nivel);
  const sumAttrs = ATRIBUTOS.reduce((sum, attribute) => sum + atributosNum[attribute], 0);
  const restantes = totalPoints - sumAttrs;
  const reducao = ATRIBUTOS.reduce((sum, attribute) => sum + Math.max(0, ATTRIBUTE_BASE - atributosNum[attribute]), 0);
  const capA = nivel >= 18 ? Infinity : nivel <= 6 ? 12 : nivel <= 13 ? 15 : 18;

  const handleAtributoChange = (attribute, value) => {
    if (value < 0 || value > capA) {
      setErroAtributos(`O valor precisa ficar entre 0 e ${capA === Infinity ? "∞" : capA}.`);
      return;
    }
    const next = { ...atributosNum, [attribute]: value };
    const nextSum = ATRIBUTOS.reduce((sum, key) => sum + next[key], 0);
    const nextReduction = ATRIBUTOS.reduce((sum, key) => sum + Math.max(0, ATTRIBUTE_BASE - next[key]), 0);
    if (nextReduction > MAX_REDUCTION) {
      setErroAtributos(`O máximo é ${MAX_REDUCTION} pontos de redução abaixo da base 5.`);
      return;
    }
    if (nextSum > totalPoints) {
      setErroAtributos(`Você ultrapassou o limite de ${totalPoints} pontos.`);
      return;
    }
    setErroAtributos("");
    setHasChanges(true);
    setFicha((current) => ({ ...current, [attribute]: value }));
  };

  const rolarAttr = async (name, value) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const category = categorize(roll, value, sor);
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const entry = { localId: `atributo-${Date.now()}`, Horario: time, "Nome do Personagem": ficha["Nome do Personagem"] || "Desconhecido", Tipo: "Atributo", Nome: name, Valor: roll, "Tipo de Sucesso": category };
    setHistoricoRolagens((current) => [entry, ...current]);
    publicarRolagemPortrait({ fichaId: ficha.ID, tipo: "Atributo", nome: name, valor: roll, tipoSucesso: category });
    apiPost("salvarRolagem", { "ID da Ficha": ficha.ID, Horario: time, "Nome do Personagem": ficha["Nome do Personagem"], Tipo: "Atributo", Nome: name, Valor: roll, "Tipo de Sucesso": category }).catch(console.error);
    setRollAttr({ nome: name, roll, category });
  };

  const concludePending = async (pending) => {
    try {
      await apiPost("concluirPendenciaNex", { pendenciaId: pending.ID });
      setPendencias((current) => current.filter((item) => item.ID !== pending.ID));
      setFicha((current) => ({ ...current, "Pendência de Progressão": "" }));
    } catch (error) {
      setSaveState({ type: "error", message: error.message });
    }
  };

  const handleExit = async () => {
    if (isMestre) {
      navigate("/painel");
      return;
    }
    try { await apiPost("logout"); } catch { /* encerra localmente */ }
    clearSession();
    navigate("/");
  };

  const renderModule = (moduleId) => {
    switch (moduleId) {
      case "Habilidades":
        return <HabilidadesSection fichaId={ficha.ID} atributos={atributosNum} sor={sor} nivel={nivel} bonusManual={bonusManual} setBonusManual={(value) => { setBonusManual(value); setHasChanges(true); }} pontosDisponiveis={pontosPericia} limitePorPericia={limitePorPericia} />;
      case "Rituais":
        return <RituaisSection fichaId={ficha.ID} nivel={nivel} intelecto={atributosNum.INT} nomePersonagem={ficha["Nome do Personagem"]} registrarRolagem={(roll) => setHistoricoRolagens((current) => [roll, ...current])} />;
      case "Inventário": return <InventarioSection fichaId={ficha.ID} />;
      case "Rolagens": return <RolagensSection fichaId={ficha.ID} rolagensLocais={historicoRolagens} />;
      case "Carteira": return <CarteiraSection fichaId={ficha.ID} />;
      default: return <CombatEntryForm fichaId={ficha.ID} nomePersonagem={ficha["Nome do Personagem"]} registrarRolagem={(roll) => setHistoricoRolagens((current) => [roll, ...current])} />;
    }
  };

  const activeModuleData = MODULES.find((item) => item.id === activeModule) || MODULES[0];
  const ActiveModuleIcon = activeModuleData.icon;

  return <div className="play-page"><div className="play-background" aria-hidden="true" />
    <header className="play-topbar"><div className="play-topbar-inner"><div className="play-brand"><span className="play-brand-mark"><Shield size={18} /></span><div><strong>REDENÇÃO</strong><span>Ficha operacional</span></div></div><div className="play-topbar-actions"><div className={`play-change-state ${hasChanges ? "is-dirty" : "is-clean"}`}>{hasChanges ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}<span>{hasChanges ? "Alterações não salvas" : "Tudo sincronizado"}</span></div><button type="button" className="play-ghost-button" onClick={() => navigate("/investigacao")}><BookOpen size={17} /><span>Investigação</span></button><button type="button" className="play-ghost-button" onClick={handleExit}>{isMestre ? <LayoutDashboard size={17} /> : <LogOut size={17} />}<span>{isMestre ? "Painel do mestre" : "Sair"}</span></button><button type="button" className="play-save-button" onClick={salvarFicha} disabled={saveState.type === "saving"} title="Salvar ficha (Ctrl+S)"><Save size={18} /><span>{saveState.type === "saving" ? "Salvando..." : "Salvar ficha"}</span><kbd>Ctrl S</kbd></button></div></div></header>

    <main className="play-shell">
      {pendencias.length ? <section className="progress-pending-banner"><div><AlertCircle size={22} /><div><strong>Progressão pendente</strong><span>O mestre alterou seu NEX. Revise suas escolhas; PV, PE e Sanidade não foram recuperados automaticamente.</span></div></div>{pendencias.map((pending) => <article key={pending.ID}><span>NEX {pending["NEX Anterior"]}% → {pending["NEX Novo"]}%</span><small>{new Date(pending["Criada Em"]).toLocaleString("pt-BR")}</small><button type="button" onClick={() => concludePending(pending)}>Marcar como concluída</button></article>)}</section> : null}

      <section className="play-hero-card"><CharacterHeader ficha={ficha} imagemUrl={imagemUrl} onImagemChange={(image) => { setImagemUrl(image); setFicha((current) => ({ ...current, "Imagem do Personagem": image })); setHasChanges(true); }} onClasseChange={(newClass) => { setFicha((current) => ({ ...current, Classe: newClass })); setHasChanges(true); }} />
        <VitalStatsSection pvAtual={pvAtual} pvMax={pvMax} peAtual={peAtual} peMax={peMax} sanAtual={sanAtual} sanMax={sanMax} setPvAtual={(value) => { setPvAtual(value); setHasChanges(true); setStatusAlterado(true); }} setPeAtual={(value) => { setPeAtual(value); setHasChanges(true); setStatusAlterado(true); }} setSanAtual={(value) => { setSanAtual(value); setHasChanges(true); setStatusAlterado(true); }} agi={atributosNum.AGI} vig={atributosNum.VIG} rd={Number(ficha.RD) || 0} rdObservacao={ficha["Observação da RD"] || ""} onRdChange={(value) => { setFicha((current) => ({ ...current, RD: value })); setHasChanges(true); }} onRdObservacaoChange={(value) => { setFicha((current) => ({ ...current, "Observação da RD": value })); setHasChanges(true); }} />
      </section>

      <section className="play-section-card play-attributes-section"><div className="play-section-heading"><div><span className="play-eyebrow">NÚCLEO DO PERSONAGEM</span><h2>Atributos</h2><p>Base 5. Ajuste os valores ou clique no dado para uma rolagem imediata.</p></div><div className="play-points-summary"><div><strong>{restantes}</strong><span>restantes</span></div><div><strong>{reducao}/{MAX_REDUCTION}</strong><span>reduções</span></div></div></div>{erroAtributos ? <div className="play-inline-error"><AlertCircle size={17} />{erroAtributos}</div> : null}<div className="play-attributes-grid">{ATRIBUTOS.map((attribute) => <article className="play-attribute-card" key={attribute}><div className="play-attribute-copy"><span>{ATRIBUTO_NOMES[attribute]}</span><strong>{attribute}</strong></div><div className="play-attribute-controls"><button type="button" aria-label={`Diminuir ${ATRIBUTO_NOMES[attribute]}`} onClick={() => handleAtributoChange(attribute, atributosNum[attribute] - 1)}>−</button><b>{atributosNum[attribute]}</b><button type="button" aria-label={`Aumentar ${ATRIBUTO_NOMES[attribute]}`} onClick={() => handleAtributoChange(attribute, atributosNum[attribute] + 1)}>+</button></div><button type="button" className="play-attribute-roll" onClick={() => rolarAttr(attribute, atributosNum[attribute])} title={`Rolar ${ATRIBUTO_NOMES[attribute]}`}><FaDiceD20 /><span>Rolar</span></button></article>)}</div></section>

      <section className="play-agent-workspace"><section className="play-section-card play-modules-section"><div className="play-section-heading play-modules-heading"><div><span className="play-eyebrow">ÁREA DE JOGO</span><h2>Recursos do agente</h2><p>Selecione uma categoria para abrir seu conteúdo.</p></div></div><div className="play-modules-layout"><nav className="play-module-nav" aria-label="Recursos da ficha">{MODULES.map((module) => { const Icon = module.icon; const active = activeModule === module.id; return <button type="button" key={module.id} className={active ? "is-active" : ""} onClick={() => setActiveModule(module.id)} aria-pressed={active}><span className="play-module-icon"><Icon size={18} /></span><span className="play-module-copy"><strong>{module.label}</strong><small>{module.subtitle}</small></span></button>; })}</nav><div className="play-module-panel"><div className="play-module-panel-title"><span><ActiveModuleIcon size={19} /></span><div><strong>{activeModuleData.label}</strong><small>{activeModuleData.subtitle}</small></div></div><div className="play-module-body">{MODULES.map((module) => <div key={module.id} className="play-module-view" hidden={activeModule !== module.id} aria-hidden={activeModule !== module.id}>{renderModule(module.id)}</div>)}</div></div></div></section>
        <div className="play-skills-column"><PericiasSection atributos={atributosNum} sor={sor} nivel={nivel} fichaId={ficha.ID} nomePersonagem={ficha["Nome do Personagem"]} bonusManual={bonusManual} setBonusManual={(value) => { setBonusManual(value); setHasChanges(true); }} pontosDisponiveis={pontosPericia} limitePorPericia={limitePorPericia} registrarRolagem={(roll) => setHistoricoRolagens((current) => [{ localId: `pericia-${Date.now()}`, Horario: roll.horario, "Nome do Personagem": roll.personagem, Tipo: "Perícia", Nome: roll.pericia, Valor: roll.valor, "Tipo de Sucesso": roll.tipoSucesso }, ...current])} /></div>
      </section>
    </main>

    {saveState.type !== "idle" ? <div className={`play-save-toast is-${saveState.type}`}>{saveState.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}<span>{saveState.message}</span></div> : null}
    {rollAttr ? <div className="play-roll-toast"><button type="button" onClick={() => setRollAttr(null)} aria-label="Fechar resultado">×</button><div className="play-roll-die"><FaDiceD20 /><strong>{rollAttr.roll}</strong></div><div className="play-roll-copy"><span>ROLAGEM DE ATRIBUTO</span><strong>{rollAttr.nome}</strong><b style={categoryStyles[rollAttr.category]}>{rollAttr.category}</b></div></div> : null}
  </div>;
}
