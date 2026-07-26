import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Backpack,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Dices,
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
import "./FichaJogador.css";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

const ATRIBUTOS = ["AGI", "FOR", "INT", "PRE", "VIG", "SOR"];
const ATRIBUTO_NOMES = {
  AGI: "Agilidade",
  FOR: "Força",
  INT: "Intelecto",
  PRE: "Presença",
  VIG: "Vigor",
  SOR: "Sorte",
};
const BASE_VALUE = 4;
const MAX_REDUCTION = 6;

const MODULES = [
  { id: "Combate", label: "Combate", subtitle: "Ataques e equipamentos", icon: Swords },
  { id: "Habilidades", label: "Habilidades", subtitle: "Poderes e características", icon: Sparkles },
  { id: "Rituais", label: "Rituais", subtitle: "Conhecimento paranormal", icon: ScrollText },
  { id: "Inventário", label: "Inventário", subtitle: "Itens e carga", icon: Backpack },
  { id: "Rolagens", label: "Rolagens", subtitle: "Histórico da sessão", icon: History },
  { id: "Carteira", label: "Carteira", subtitle: "Recursos e valores", icon: CircleDollarSign },
];

function categorize(roll, skill, sor) {
  if (roll === 1 && sor < 20) return "Desastre";
  const thP = 21 - Math.floor(skill / 17);
  const thE = 21 - Math.floor(skill / 5);
  const thB = 21 - Math.floor(skill / 2);
  const thN = 21 - skill;
  if (skill > 15 && roll >= thP) return "Sucesso Perfeito";
  if (roll >= thE) return "Sucesso Extremo";
  if (roll >= thB) return "Sucesso Bom";
  if (roll >= thN) return "Sucesso";
  return "Fracasso";
}

const categoryStyles = {
  Desastre: { color: "#ff3b5c", textShadow: "0 0 18px rgba(255,59,92,.75)" },
  Fracasso: { color: "#ff6b6b", textShadow: "0 0 12px rgba(255,107,107,.35)" },
  Sucesso: { color: "#55e98f", textShadow: "0 0 14px rgba(85,233,143,.4)" },
  "Sucesso Bom": { color: "#5de1ff", textShadow: "0 0 14px rgba(93,225,255,.45)" },
  "Sucesso Extremo": { color: "#f7fbff", textShadow: "0 0 15px rgba(93,225,255,.6)" },
  "Sucesso Perfeito": { color: "#f7c948", textShadow: "0 0 18px rgba(247,201,72,.65)" },
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

export default function FichaJogador() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ficha, setFicha] = useState(null);
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

  const nivel = ficha ? getNivel(ficha.NEX) : 1;
  const usuarioAtual = getStoredUser();
  const isMestre = usuarioAtual?.tipo === "mestre";

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    const data = localStorage.getItem("usuario");

    fetch(`${BASE_URL}?sheet=Fichas`)
      .then((r) => r.json())
      .then((lista) => {
        let encontrada;

        if (idFromUrl) {
          encontrada = lista.find((item) => String(item.ID) === String(idFromUrl));
        } else if (data) {
          const { usuario } = JSON.parse(data);
          encontrada = lista.find(
            (item) =>
              item["Login do Jogador"]?.toLowerCase() === String(usuario).toLowerCase()
          );
        }

        if (!encontrada) return navigate("/");

        setFicha(encontrada);
        setImagemUrl(encontrada["Imagem do Personagem"] || "");

        const bonus = {};
        Object.keys(encontrada).forEach((chave) => {
          if (chave.startsWith("Bonus_")) {
            bonus[chave.replace("Bonus_", "")] = +encontrada[chave];
          }
        });
        setBonusManual(bonus);
      })
      .catch(() => navigate("/"));
  }, [navigate, searchParams]);

  useEffect(() => {
    if (!ficha) return;

    const modPV = Number(ficha["Mod. PV Máx."]) || 0;
    const modPE = Number(ficha["Mod. PE Máx."]) || 0;
    const modSAN = Number(ficha["Mod. SAN Máx."]) || 0;
    const novoPvMax = getPV(ficha.Classe, +ficha.VIG, nivel) + modPV;
    const novoPeMax = getPE(ficha.Classe, +ficha.PRE, nivel) + modPE;
    const novoSanMax = getSAN(ficha.Classe, nivel) + modSAN;
    const parseOr = (value, fallback) => {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    setPvMax(novoPvMax);
    setPeMax(novoPeMax);
    setSanMax(novoSanMax);
    setPvAtual(parseOr(ficha["PV Atual"], novoPvMax));
    setPeAtual(parseOr(ficha["PE Atual"], novoPeMax));
    setSanAtual(parseOr(ficha["Sanidade Atual"], novoSanMax));
  }, [ficha, nivel]);

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
    const handleUnload = () => {
      if (!hasChanges || !ficha) return;
      const formData = new URLSearchParams();
      formData.append("acao", "salvarFicha");
      formData.append("ID", ficha.ID);
      formData.append("Imagem do Personagem", imagemUrl);
      formData.append("Classe", ficha.Classe);
      formData.append("PV Atual", pvAtual);
      formData.append("PE Atual", peAtual);
      formData.append("Sanidade Atual", sanAtual);
      formData.append("PV Máx.", pvMax);
      formData.append("PE Máx.", peMax);
      formData.append("Sanidade Máx.", sanMax);
      ATRIBUTOS.forEach((atributo) => formData.append(atributo, ficha[atributo]));
      Object.entries(bonusManual).forEach(([nome, valor]) => {
        formData.append(`Bonus_${nome}`, valor);
      });
      navigator.sendBeacon(BASE_URL, formData);
    };

    window.addEventListener("unload", handleUnload);
    return () => window.removeEventListener("unload", handleUnload);
  }, [
    ficha,
    imagemUrl,
    bonusManual,
    pvAtual,
    peAtual,
    sanAtual,
    pvMax,
    peMax,
    sanMax,
    hasChanges,
  ]);

  useEffect(() => {
    if (!ficha?.ID) return undefined;
    const token = obterTokenPortrait(ficha.ID);
    return conectarCanalPortraitRemoto({ fichaId: ficha.ID, token });
  }, [ficha?.ID]);

  useEffect(() => {
    if (!ficha?.ID) return;
    publicarStatusPortrait({
      fichaId: ficha.ID,
      pvAtual,
      pvMax,
      sanAtual,
      sanMax,
      peAtual,
      peMax,
    });
  }, [ficha?.ID, pvAtual, pvMax, sanAtual, sanMax, peAtual, peMax]);

  useEffect(() => {
    if (!statusAlterado || !ficha?.ID) return undefined;

    const timer = window.setTimeout(() => {
      const formData = new URLSearchParams();
      formData.append("acao", "salvarFicha");
      formData.append("ID", ficha.ID);
      formData.append("PV Atual", pvAtual);
      formData.append("PE Atual", peAtual);
      formData.append("Sanidade Atual", sanAtual);
      formData.append("PV Máx.", pvMax);
      formData.append("PE Máx.", peMax);
      formData.append("Sanidade Máx.", sanMax);
      fetch(BASE_URL, { method: "POST", body: formData }).catch(console.error);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [
    statusAlterado,
    ficha?.ID,
    pvAtual,
    peAtual,
    sanAtual,
    pvMax,
    peMax,
    sanMax,
  ]);

  const atributosNum = useMemo(() => {
    if (!ficha) return ATRIBUTOS.reduce((result, key) => ({ ...result, [key]: BASE_VALUE }), {});
    return ATRIBUTOS.reduce(
      (result, key) => ({
        ...result,
        [key]: ficha[key] != null ? Number(ficha[key]) : BASE_VALUE,
      }),
      {}
    );
  }, [ficha]);

  const salvarFicha = useCallback(async () => {
    if (!ficha || saveState.type === "saving") return;

    setSaveState({ type: "saving", message: "Salvando alterações..." });
    const formData = new URLSearchParams();
    formData.append("acao", "salvarFicha");
    formData.append("ID", ficha.ID);
    formData.append("Imagem do Personagem", imagemUrl);
    formData.append("Classe", ficha.Classe);
    formData.append("PV Atual", pvAtual);
    formData.append("PE Atual", peAtual);
    formData.append("Sanidade Atual", sanAtual);
    formData.append("PV Máx.", pvMax);
    formData.append("PE Máx.", peMax);
    formData.append("Sanidade Máx.", sanMax);
    ATRIBUTOS.forEach((atributo) => formData.append(atributo, ficha[atributo]));
    Object.entries(bonusManual).forEach(([nome, valor]) => {
      formData.append(`Bonus_${nome}`, valor);
    });

    try {
      const response = await fetch(BASE_URL, { method: "POST", body: formData });
      const responseText = await response.text();
      if (!response.ok) throw new Error(`Servidor respondeu com erro ${response.status}.`);

      let resultado = null;
      try {
        resultado = JSON.parse(responseText);
      } catch {
        resultado = null;
      }

      const mensagemServidor = String(
        resultado?.message || resultado?.mensagem || responseText || ""
      ).toLowerCase();

      if (
        resultado?.status === "erro" ||
        resultado?.status === "error" ||
        mensagemServidor.includes("ação inválida") ||
        mensagemServidor.includes("acao invalida")
      ) {
        throw new Error(resultado?.message || resultado?.mensagem || responseText);
      }

      setHasChanges(false);
      setSaveState({ type: "success", message: "Ficha salva com sucesso." });
      window.setTimeout(() => setSaveState({ type: "idle", message: "" }), 2600);
    } catch (error) {
      console.error("Erro ao salvar ficha:", error);
      setSaveState({ type: "error", message: "Não foi possível salvar a ficha." });
    }
  }, [
    ficha,
    imagemUrl,
    pvAtual,
    peAtual,
    sanAtual,
    pvMax,
    peMax,
    sanMax,
    bonusManual,
    saveState.type,
  ]);

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

  if (!ficha) {
    return (
      <div className="play-loading">
        <div className="play-loading-mark"><Shield size={30} /></div>
        <div>
          <strong>Abrindo ficha operacional</strong>
          <span>Sincronizando os dados do personagem...</span>
        </div>
      </div>
    );
  }

  const sor = +ficha.SOR;
  const totalPoints = ATRIBUTOS.length * BASE_VALUE + 20 + (nivel - 1);
  const pontosPericia = getPontosPericiaTotal(ficha.Classe, atributosNum.INT, nivel);
  const limitePorPericia = getLimiteBonusPorNivel(nivel);
  const sumAttrs = ATRIBUTOS.reduce((sum, atributo) => sum + atributosNum[atributo], 0);
  const restantes = totalPoints - sumAttrs;
  const reducao = ATRIBUTOS.reduce(
    (sum, atributo) => sum + Math.max(0, BASE_VALUE - atributosNum[atributo]),
    0
  );
  const capA = nivel >= 18 ? Infinity : nivel <= 6 ? 12 : nivel <= 13 ? 15 : 18;

  const handleAtributoChange = (attr, novoVal) => {
    if (novoVal < 0 || novoVal > capA) {
      setErroAtributos(`O valor precisa ficar entre 0 e ${capA}.`);
      return;
    }

    const newAttrs = { ...atributosNum, [attr]: novoVal };
    const newSum = ATRIBUTOS.reduce((sum, atributo) => sum + newAttrs[atributo], 0);
    const newRed = ATRIBUTOS.reduce(
      (sum, atributo) => sum + Math.max(0, BASE_VALUE - newAttrs[atributo]),
      0
    );

    if (newRed > MAX_REDUCTION) {
      setErroAtributos(`O máximo é ${MAX_REDUCTION} pontos de redução.`);
      return;
    }
    if (newSum > totalPoints) {
      setErroAtributos(`Você ultrapassou o limite de ${totalPoints} pontos.`);
      return;
    }

    setErroAtributos("");
    setHasChanges(true);
    setFicha((current) => ({ ...current, [attr]: novoVal }));
  };

  const rolarAttr = (nome, valor) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const category = categorize(roll, valor, sor);
    const agora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setHistoricoRolagens((prev) => [
      {
        horario: agora,
        personagem: ficha["Nome do Personagem"] || "Desconhecido",
        pericia: nome,
        valor: roll,
        tipoSucesso: category,
        estilo: categoryStyles[category] || {},
      },
      ...prev,
    ]);

    publicarRolagemPortrait({
      fichaId: ficha.ID,
      tipo: "Atributo",
      nome,
      valor: roll,
      tipoSucesso: category,
    });

    fetch(BASE_URL, {
      method: "POST",
      body: new URLSearchParams({
        acao: "salvarRolagem",
        "ID da Ficha": ficha.ID,
        Horario: agora,
        "Nome do Personagem": ficha["Nome do Personagem"],
        Tipo: "Atributo",
        Nome: nome,
        Valor: roll,
        "Tipo de Sucesso": category,
      }),
    }).catch(console.error);

    setRollAttr({ nome, roll, category });
  };

  const handleExit = () => {
    if (isMestre) {
      navigate("/painel");
      return;
    }
    localStorage.removeItem("usuario");
    navigate("/");
  };

  const renderModule = () => {
    switch (activeModule) {
      case "Habilidades":
        return (
          <HabilidadesSection
            fichaId={ficha.ID}
            atributos={atributosNum}
            sor={sor}
            nivel={nivel}
            bonusManual={bonusManual}
            setBonusManual={(value) => {
              setBonusManual(value);
              setHasChanges(true);
            }}
            pontosDisponiveis={pontosPericia}
            limitePorPericia={limitePorPericia}
          />
        );
      case "Rituais":
        return <RituaisSection fichaId={ficha.ID} nivel={nivel} intelecto={atributosNum.INT} />;
      case "Inventário":
        return <InventarioSection fichaId={ficha.ID} />;
      case "Rolagens":
        return <RolagensSection fichaId={ficha.ID} />;
      case "Carteira":
        return <CarteiraSection fichaId={ficha.ID} />;
      case "Combate":
      default:
        return <CombatEntryForm fichaId={ficha.ID} />;
    }
  };

  const activeModuleData = MODULES.find((item) => item.id === activeModule) || MODULES[0];
  const ActiveModuleIcon = activeModuleData.icon;

  return (
    <div className="play-page">
      <div className="play-background" aria-hidden="true" />

      <header className="play-topbar">
        <div className="play-topbar-inner">
          <div className="play-brand">
            <span className="play-brand-mark"><Shield size={18} /></span>
            <div>
              <strong>REDENÇÃO</strong>
              <span>Ficha operacional</span>
            </div>
          </div>

          <div className="play-topbar-actions">
            <div className={`play-change-state ${hasChanges ? "is-dirty" : "is-clean"}`}>
              {hasChanges ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
              <span>{hasChanges ? "Alterações não salvas" : "Tudo sincronizado"}</span>
            </div>
            <button type="button" className="play-ghost-button" onClick={handleExit}>
              {isMestre ? <LayoutDashboard size={17} /> : <LogOut size={17} />}
              <span>{isMestre ? "Painel do mestre" : "Sair"}</span>
            </button>
            <button
              type="button"
              className="play-save-button"
              onClick={salvarFicha}
              disabled={saveState.type === "saving"}
              title="Salvar ficha (Ctrl+S)"
            >
              <Save size={18} />
              <span>{saveState.type === "saving" ? "Salvando..." : "Salvar ficha"}</span>
              <kbd>Ctrl S</kbd>
            </button>
          </div>
        </div>
      </header>

      <main className="play-shell">
        <section className="play-hero-card">
          <CharacterHeader
            ficha={ficha}
            imagemUrl={imagemUrl}
            onImagemChange={(novaImagem) => {
              setImagemUrl(novaImagem);
              setFicha((current) => ({
                ...current,
                ["Imagem do Personagem"]: novaImagem,
              }));
              setHasChanges(true);
            }}
            onClasseChange={(newClass) => {
              setFicha((current) => ({ ...current, Classe: newClass }));
              setHasChanges(true);
            }}
          />

          <VitalStatsSection
            pvAtual={pvAtual}
            pvMax={pvMax}
            peAtual={peAtual}
            peMax={peMax}
            sanAtual={sanAtual}
            sanMax={sanMax}
            setPvAtual={(value) => {
              setPvAtual(value);
              setHasChanges(true);
              setStatusAlterado(true);
            }}
            setPeAtual={(value) => {
              setPeAtual(value);
              setHasChanges(true);
              setStatusAlterado(true);
            }}
            setSanAtual={(value) => {
              setSanAtual(value);
              setHasChanges(true);
              setStatusAlterado(true);
            }}
            agi={atributosNum.AGI}
            vig={atributosNum.VIG}
          />
        </section>

        <section className="play-section-card play-attributes-section">
          <div className="play-section-heading">
            <div>
              <span className="play-eyebrow">NÚCLEO DO PERSONAGEM</span>
              <h2>Atributos</h2>
              <p>Ajuste os valores ou clique no dado para fazer uma rolagem imediata.</p>
            </div>
            <div className="play-points-summary">
              <div><strong>{restantes}</strong><span>restantes</span></div>
              <div><strong>{reducao}/{MAX_REDUCTION}</strong><span>reduções</span></div>
            </div>
          </div>

          {erroAtributos && <div className="play-inline-error"><AlertCircle size={17} />{erroAtributos}</div>}

          <div className="play-attributes-grid">
            {ATRIBUTOS.map((atributo) => (
              <article className="play-attribute-card" key={atributo}>
                <div className="play-attribute-copy">
                  <span>{ATRIBUTO_NOMES[atributo]}</span>
                  <strong>{atributo}</strong>
                </div>
                <div className="play-attribute-controls">
                  <button
                    type="button"
                    aria-label={`Diminuir ${ATRIBUTO_NOMES[atributo]}`}
                    onClick={() => handleAtributoChange(atributo, atributosNum[atributo] - 1)}
                  >
                    −
                  </button>
                  <b>{atributosNum[atributo]}</b>
                  <button
                    type="button"
                    aria-label={`Aumentar ${ATRIBUTO_NOMES[atributo]}`}
                    onClick={() => handleAtributoChange(atributo, atributosNum[atributo] + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="play-attribute-roll"
                  onClick={() => rolarAttr(atributo, atributosNum[atributo])}
                  title={`Rolar ${ATRIBUTO_NOMES[atributo]}`}
                >
                  <FaDiceD20 />
                  <span>Rolar</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        <PericiasSection
          atributos={atributosNum}
          sor={sor}
          nivel={nivel}
          fichaId={ficha.ID}
          nomePersonagem={ficha["Nome do Personagem"]}
          bonusManual={bonusManual}
          setBonusManual={(value) => {
            setBonusManual(value);
            setHasChanges(true);
          }}
          pontosDisponiveis={pontosPericia}
          limitePorPericia={limitePorPericia}
          registrarRolagem={(rolagem) =>
            setHistoricoRolagens((prev) => [rolagem, ...prev])
          }
        />

        <section className="play-section-card play-modules-section">
          <div className="play-section-heading play-modules-heading">
            <div>
              <span className="play-eyebrow">ÁREA DE JOGO</span>
              <h2>Recursos do agente</h2>
              <p>Combate, habilidades, rituais, inventário e registros em um único lugar.</p>
            </div>
          </div>

          <div className="play-modules-layout">
            <nav className="play-module-nav" aria-label="Recursos da ficha">
              {MODULES.map((module) => {
                const Icon = module.icon;
                const active = activeModule === module.id;
                return (
                  <button
                    type="button"
                    key={module.id}
                    className={active ? "is-active" : ""}
                    onClick={() => setActiveModule(module.id)}
                  >
                    <span className="play-module-icon"><Icon size={19} /></span>
                    <span className="play-module-copy">
                      <strong>{module.label}</strong>
                      <small>{module.subtitle}</small>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="play-module-panel">
              <div className="play-module-panel-title">
                <span><ActiveModuleIcon size={19} /></span>
                <div>
                  <strong>{activeModuleData.label}</strong>
                  <small>{activeModuleData.subtitle}</small>
                </div>
              </div>
              <div className="play-module-body">{renderModule()}</div>
            </div>
          </div>
        </section>
      </main>

      {saveState.type !== "idle" && (
        <div className={`play-save-toast is-${saveState.type}`}>
          {saveState.type === "success" ? <CheckCircle2 size={20} /> : saveState.type === "error" ? <AlertCircle size={20} /> : <Save size={20} />}
          <span>{saveState.message}</span>
        </div>
      )}

      {rollAttr && (
        <div className="play-roll-toast">
          <button type="button" onClick={() => setRollAttr(null)} aria-label="Fechar resultado">×</button>
          <div className="play-roll-die"><FaDiceD20 /><strong>{rollAttr.roll}</strong></div>
          <div className="play-roll-copy">
            <span>ROLAGEM DE ATRIBUTO</span>
            <strong>{rollAttr.nome}</strong>
            <b style={categoryStyles[rollAttr.category]}>{rollAttr.category}</b>
          </div>
        </div>
      )}
    </div>
  );
}
