// src/components/VitalStatsSection.jsx
import React, { useState } from "react";
import CombatEntryForm from "../components/CombatEntryForm";
import HabilidadesSection from "../components/HabilidadesSection";
import RituaisSection from "../components/RituaisSection";
import InventarioSection from "../components/InventarioSection";
import RolagensSection from "../components/RolagensSection";
import CarteiraSection from "../components/CarteiraSection";

const TABS = [
  "Combate",
  "Habilidades",
  "Rituais",
  "Inventário",
  "Rolagens",
  "Carteira",
];

export default function VitalStatsSection({
  pvAtual,
  pvMax,
  peAtual,
  peMax,
  sanAtual,
  sanMax,
  setPvAtual,
  setPeAtual,
  setSanAtual,
  agi,
  vig,
  fichaId,
  atributos,
  sor,
  nivel,
  intelecto,
  bonusManual,
  setBonusManual,
  pontosDisponiveis,
  limitePorPericia,
  inventario,
  setInventario,
  campoNotas,
  setCampoNotas,
  campoAnotacoes,
  setCampoAnotacoes,
}) {
  const [historicoRolagens, setHistoricoRolagens] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const deslocamento = Math.floor((agi + vig) / 20) + 7;
  const [modPV, setModPV] = useState("");
  const [modPE, setModPE] = useState("");
  const [modSAN, setModSAN] = useState("");

  const inputStyle = {
    width: 56,
    height: 34,
    marginLeft: 10,
    textAlign: "center",
    borderRadius: 4,
    border: "1px solid #D4AF37",
    background: "#000",
    color: "#D4AF37",
    fontWeight: "bold",
    fontSize: 16,
  };

  const arrowBtnStyle = {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer",
    padding: 0,
  };

  const makeBar = (label, atual, max, color, setAtual, mod, setMod) => {
    const percent = Math.min((atual / max) * 100, 100);
    const applyChange = (delta) => {
      const novo = atual + delta;
      setAtual(Math.max(0, novo));
    };
    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        const valor = parseInt(mod);
        if (!isNaN(valor)) applyChange(valor);
        setMod("");
      }
    };
    return (
      <div style={{ marginBottom: 28, width: "100%" }}>
        <div
          style={{
            textAlign: "center",
            color: "#D4AF37",
            fontWeight: "bold",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              flexGrow: 1,
              position: "relative",
              height: 34,
              background: "#111",
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid #D4AF37",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                backgroundColor: color,
                transition: "width 0.3s ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "100%",
                textAlign: "center",
                top: 0,
                lineHeight: "34px",
                color: "#fff",
                fontWeight: "bold",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                userSelect: "none",
              }}
            >
              <button onClick={() => applyChange(-1)} style={arrowBtnStyle}>
                &lt;
              </button>
              {atual} / {max}
              <button onClick={() => applyChange(1)} style={arrowBtnStyle}>
                &gt;
              </button>
            </div>
          </div>
          <input
            type="number"
            value={mod}
            onChange={(e) => setMod(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="+0"
            style={inputStyle}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      {makeBar("Vida", pvAtual, pvMax, "#dc2626", setPvAtual, modPV, setModPV)}
      {makeBar(
        "Sanidade",
        sanAtual,
        sanMax,
        "#9333ea",
        setSanAtual,
        modSAN,
        setModSAN
      )}
      {makeBar("Esforço", peAtual, peMax, "#f97316", setPeAtual, modPE, setModPE)}

      <div
        style={{
          textAlign: "center",
          color: "#D4AF37",
          fontWeight: "bold",
          fontSize: 16,
          marginTop: 10,
        }}
      >
        Deslocamento: {deslocamento}m
      </div>

      {/* Abas de Campos Extras */}
      <div style={{ marginTop: 32, borderTop: "1px solid #444", paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 24 }}>
            {TABS.map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  cursor: "pointer",
                  color: activeTab === tab ? "#fff" : "#888",
                  borderBottom: activeTab === tab ? "2px solid #D4AF37" : "none",
                  paddingBottom: 4,
                }}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>

        {activeTab === "Combate" && <CombatEntryForm fichaId={fichaId} />}

        {activeTab === "Rolagens" && <RolagensSection fichaId={fichaId} />}

        {activeTab === "Habilidades" && (
          <HabilidadesSection
            fichaId={fichaId}
            atributos={atributos}
            sor={sor}
            nivel={nivel}
            bonusManual={bonusManual}
            setBonusManual={setBonusManual}
            pontosDisponiveis={pontosDisponiveis}
            limitePorPericia={limitePorPericia}
          />
        )}

        {activeTab === "Rituais" && (
          <RituaisSection fichaId={fichaId} nivel={nivel} intelecto={intelecto} />
        )}

        {activeTab === "Inventário" && (
          <InventarioSection fichaId={fichaId} inventario={inventario} setInventario={setInventario} />
        )}

        {activeTab === "Carteira" && <CarteiraSection fichaId={fichaId} />}
      </div>
    </div>
  );
}
