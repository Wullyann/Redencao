// src/pages/FichaJogador.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaDiceD20 } from "react-icons/fa";
import CharacterHeader from "../components/CharacterHeader";
import VitalStatsSection from "../components/VitalStatsSection";
import PericiasSection from "../components/PericiasSection";
import RituaisSection from "../components/RituaisSection";
import CombatEntryForm from "../components/CombatEntryForm";
import HabilidadesSection from "../components/HabilidadesSection";
import UploadImagem from "../components/UploadImagem";
import RolagensSection from "../components/RolagensSection";
import {
  getNivel,
  getLimiteBonusPorNivel,
  getPontosPericiaTotal,
  getPV,
  getPE,
  getSAN,
} from "../utils/calculosPorClasse";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

// Atributos
const ATRIBUTOS = ["AGI", "FOR", "INT", "PRE", "VIG", "SOR"];
const BASE_VALUE = 4;
const MAX_REDUCTION = 6;

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
  Desastre: { color: "#DC143C", textShadow: "0 0 16px #DC143C, 0 0 24px #FF0000" },
  Fracasso: { color: "#8B0000", textShadow: "0 0 6px #8B0000" },
  Sucesso: {
    color: "#00FF00",
    textShadow: "0 0 12px #00FF00",
    fontSize: "20px",
  },
  "Sucesso Bom": {
    color: "#00FFFF",
    textShadow: "0 0 12px #00FFFF",
    fontSize: "18px",
  },
  "Sucesso Extremo": {
    color: "#FFFFFF",
    textShadow: "0 0 8px #00FFFF",
    fontSize: "18px",
  },
  "Sucesso Perfeito": {
    color: "#FFD700",
    textShadow: "0 0 8px #FFD700",
    fontSize: "22px",
  },
};

export default function FichaJogador() {
  const navigate = useNavigate();
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
  const [imagemUrl, setImagemUrl] = useState("");


  // Carrega ficha do jogador
  useEffect(() => {
    const data = localStorage.getItem("usuario");
    if (!data) return navigate("/");
    const { usuario } = JSON.parse(data);
    fetch(`${BASE_URL}?sheet=Fichas`)
      .then((r) => r.json())
      .then((lista) => {
        const m = lista.find(
          (f) =>
            f["Login do Jogador"]?.toLowerCase() === usuario.toLowerCase()
        );
        if (!m) return;
        setFicha(m);
        setImagemUrl(m["Imagem do Personagem"] || "");
        console.log("🧩 Ficha carregada:", m);
        const bm = {};
        Object.keys(m).forEach((k) => {
          if (k.startsWith("Bonus_")) {
            bm[k.replace("Bonus_", "")] = +m[k];
          }
        });
        setBonusManual(bm);
      })
      .catch(() => navigate("/"));
  }, [navigate]);

  // Atualiza PV/PE/SAN máximos e iniciais
  useEffect(() => {
    if (!ficha) return;
    setPvMax(getPV(ficha.Classe, +ficha.VIG, nivel));
    setPeMax(getPE(ficha.Classe, +ficha.PRE, nivel));
    setSanMax(getSAN(ficha.Classe, nivel));
const parseOr = (val, fallback) => {
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

setPvAtual(parseOr(ficha["PV Atual"], getPV(ficha.Classe, +ficha.VIG, nivel)));
setPeAtual(parseOr(ficha["PE Atual"], getPE(ficha.Classe, +ficha.PRE, nivel)));
setSanAtual(parseOr(ficha["Sanidade Atual"], getSAN(ficha.Classe, nivel)));

  }, [ficha]);

  // Aviso ao fechar sem salvar
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Auto-save ao fechar/recarregar
  useEffect(() => {
    const handleUnload = () => {
      if (!hasChanges) return;
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
      ATRIBUTOS.forEach((a) => formData.append(a, ficha[a]));
      Object.entries(bonusManual).forEach(([nome, valor]) => {
        formData.append(`Bonus_${nome}`, valor);
      });
      navigator.sendBeacon(BASE_URL, formData);
    };
    window.addEventListener("unload", handleUnload);
    return () => window.removeEventListener("unload", handleUnload);
  }, [ficha, bonusManual, pvAtual, peAtual, sanAtual, hasChanges]);

if (!ficha) {
  return <div style={{ color: "#fff" }}>Carregando ficha...</div>;
}

const nivel = getNivel(ficha.NEX);
const sor = +ficha.SOR;
const TOTAL_POINTS = ATRIBUTOS.length * BASE_VALUE + 20 + (nivel - 1);


  // Cálculo de níveis, atributos, perícias
const atributosNum = ATRIBUTOS.reduce((o, k) => {
  const raw = ficha[k];
  return {
    ...o,
    [k]: raw != null ? Number(raw) : BASE_VALUE,
  };
}, {});
  const pontosPericia = getPontosPericiaTotal(
    ficha.Classe,
    atributosNum.INT,
    nivel
  );
  const limitePorPericia = getLimiteBonusPorNivel(nivel);

  // Distribuição de atributos
  const sumAttrs = ATRIBUTOS.reduce(
    (sum, a) => sum + atributosNum[a],
    0
  );
  const restantes = TOTAL_POINTS - sumAttrs;
  const reducao = ATRIBUTOS.reduce(
    (sum, a) => sum + Math.max(0, BASE_VALUE - atributosNum[a]),
    0
  );
const capA = nivel >= 18 ? Infinity : nivel <= 6 ? 12 : nivel <= 13 ? 15 : 18;

  // Handler de alteração de atributo
  const handleAtributoChange = (attr, novoVal) => {
    setHasChanges(true);
    if (novoVal < 0 || novoVal > capA) {
      setErroAtributos(`Valor entre 0 e ${capA}.`);
      return;
    }
    const newAttrs = {
      ...atributosNum,
      [attr]: novoVal,
    };
    const newSum = ATRIBUTOS.reduce((s, a) => s + newAttrs[a], 0);
    const newRed = ATRIBUTOS.reduce(
      (s, a) => s + Math.max(0, BASE_VALUE - newAttrs[a]),
      0
    );
    if (newRed > MAX_REDUCTION) {
      setErroAtributos(`Máx ${MAX_REDUCTION} pontos de redução.`);
      return;
    }
    if (newSum > TOTAL_POINTS) {
      setErroAtributos(`Excedeu ${TOTAL_POINTS} pontos.`);
      return;
    }
    setErroAtributos("");
    setFicha({ ...ficha, [attr]: novoVal });
  };

  // Rolar atributo
const rolarAttr = (nome, valor) => {
  const roll = Math.floor(Math.random() * 20) + 1;
  const category = categorize(roll, valor, sor);
  const agora = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Atualiza o histórico local
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

  // Salva na planilha
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
  });

  setRollAttr({ nome, roll, category });
  setHasChanges(true);
};


  // Salvar ficha completa
  const salvarFicha = async () => {
    const formData = new URLSearchParams();
    formData.append("acao", "salvarFicha");
    formData.append("ID", ficha.ID);
    formData.append("Classe", ficha.Classe);
    formData.append("PV Atual", pvAtual);
    formData.append("PE Atual", peAtual);
    formData.append("Sanidade Atual", sanAtual);
    formData.append("PV Máx.", pvMax);
    formData.append("PE Máx.", peMax);
    formData.append("Sanidade Máx.", sanMax);
    ATRIBUTOS.forEach((a) => formData.append(a, ficha[a]));
    Object.entries(bonusManual).forEach(([nome, valor]) => {
      formData.append(`Bonus_${nome}`, valor);
    });
    try {
      await fetch(BASE_URL, { method: "POST", body: formData });
      alert("Ficha salva com sucesso!");
      setHasChanges(false);
    } catch (err) {
      console.error("Erro ao salvar ficha:", err);
      alert("Erro ao salvar ficha.");
    }
  };

  return (
    <div
      style={{
        background: "#000",
        color: "#D4AF37",
        minHeight: "100vh",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 20,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Lateral: Header e Vital Stats */}
        <div style={{ flex: "1 1 300px" }}>
          {/*<UploadImagem onUploadComplete={(url) => {
  setImagemUrl(url);
  setHasChanges(true);
}} />{imagemUrl && (
  <div style={{ marginTop: 12 }}>
    <img
      src={imagemUrl}
      alt="Imagem do personagem"
      style={{
        maxWidth: "100%",
        borderRadius: 8,
        border: "1px solid #D4AF37",
      }}
    />
  </div>
)}*/}

          <CharacterHeader
              ficha={ficha}
  onClasseChange={newClass => {
    setHasChanges(true);
    setFicha({ ...ficha, Classe: newClass });
            }}
          />
          <VitalStatsSection
            pvAtual={pvAtual}
            pvMax={pvMax}
            peAtual={peAtual}
            peMax={peMax}
            sanAtual={sanAtual}
            sanMax={sanMax}
            setPvAtual={(v) => { setHasChanges(true); setPvAtual(v); }}
            setPeAtual={(v) => { setHasChanges(true); setPeAtual(v); }}
            setSanAtual={(v) => { setHasChanges(true); setSanAtual(v); }}
            agi={atributosNum.AGI}
            vig={atributosNum.VIG}
            fichaId={ficha.ID}
            nivel={nivel}
            intelecto={atributosNum.INT} 
              historicoRolagens={historicoRolagens}
  setHistoricoRolagens={setHistoricoRolagens}
          />
        </div>

        {/* Conteúdo principal */}
        <div style={{ flex: "2 1 600px" }}>
          {erroAtributos && (
            <p style={{ color: "#FF6347" }}>{erroAtributos}</p>
          )}

          {/* === CAIXA DE ATRIBUTOS === */}
          <div
            style={{
              border: "1px solid #D4AF37",
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: 0, marginBottom: 12, color: "#D4AF37" }}>
              Atributos
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {ATRIBUTOS.map((a) => (
                <div
                  key={a}
                  style={{
                    background: "#111",
                    border: "1px solid #D4AF37",
                    borderRadius: 8,
                    padding: 12,
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "#B2955D",
                      textTransform: "uppercase",
                    }}
                  >
                    {a}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    <button
                      onClick={() =>
                        handleAtributoChange(a, atributosNum[a] - 1)
                      }
                      style={{
                        background: "transparent",
                        border: "1px solid #D4AF37",
                        borderRadius: 4,
                        width: 24,
                        height: 24,
                        color: "#D4AF37",
                        fontSize: 18,
                        cursor: "pointer",
                        lineHeight: 1,
                      }}
                    >
                      –
                    </button>
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: "#D4AF37",
                        minWidth: 32,
                      }}
                    >
                      {atributosNum[a]}
                    </span>
                    <button
                      onClick={() =>
                        handleAtributoChange(a, atributosNum[a] + 1)
                      }
                      style={{
                        background: "transparent",
                        border: "1px solid #D4AF37",
                        borderRadius: 4,
                        width: 24,
                        height: 24,
                        color: "#D4AF37",
                        fontSize: 18,
                        cursor: "pointer",
                        lineHeight: 1,
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => rolarAttr(a, atributosNum[a])}
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      background: "transparent",
                      border: "none",
                      color: "#D4AF37",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                  >
                    <FaDiceD20 />
                  </button>
                </div>
              ))}
            </div>

            <p
              style={{
                marginTop: 16,
                color: "#B2955D",
                fontSize: 14,
              }}
            >
              Pontos restantes: {restantes} | Reduções: {reducao} / {MAX_REDUCTION}
            </p>
          </div>
          {/* === FIM CAIXA DE ATRIBUTOS === */}
                
          {/* Perícias */}
          <PericiasSection
  atributos={atributosNum}
  sor={sor}
  nivel={nivel}
  fichaId={ficha.ID}
  nomePersonagem={ficha["Nome do Personagem"]}
  bonusManual={bonusManual}
  setBonusManual={(bm) => {
    setHasChanges(true);
    setBonusManual(bm);
  }}
  pontosDisponiveis={pontosPericia}
  limitePorPericia={limitePorPericia}
  registrarRolagem={(rolagem) =>
    setHistoricoRolagens((prev) => [rolagem, ...prev])
  }
/>

          <button
            onClick={salvarFicha}
            
            style={{
              marginTop: 20,
              padding: "8px 16px",
              backgroundColor: "#D4AF37",
              color: "#000",
              fontWeight: "bold",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Salvar Ficha
          </button>
        </div>
      </div>

      {/* Popup de resultado de atributo */}
      {rollAttr && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            background: "#1a202c",
            border: "1px solid #D4AF37",
            borderRadius: 6,
            padding: "8px 12px",
            paddingRight: 32,
            minWidth: 180,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#D4AF37",
            zIndex: 1000,
            fontSize: 13,
          }}
        >
          <button
            onClick={() => setRollAttr(null)}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              background: "transparent",
              border: "none",
              color: "#D4AF37",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
          <FaDiceD20 style={{ fontSize: 24 }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
              gap: 4,
              marginLeft: 4,
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: 14 }}>
              {rollAttr.nome}
            </span>
            <span style={{ fontSize: 13, color: "#B2955D" }}>
              [d20] → {rollAttr.roll}
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: "bold",
                marginTop: 2,
                ...categoryStyles[rollAttr.category],
              }}
            >
              {rollAttr.category}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
