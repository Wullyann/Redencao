// src/pages/EscudoDoMestre.jsx
import React, { useEffect, useState } from "react";
import RolagensPainel from "../components/RolagensPainel";
import ModalFichaDetalhada from "../components/ModalFichaDetalhada";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

export default function EscudoDoMestre() {
  const [fichas, setFichas] = useState([]);
  const [rolagens, setRolagens] = useState([]);
  const [fichaSelecionada, setFichaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}?sheet=Fichas`).then((r) => r.json()),
      fetch(`${BASE_URL}?sheet=Rolagens`).then((r) => r.json()),
    ])
      .then(([dadosFichas, dadosRolagens]) => {
        setFichas(dadosFichas || []);
        setRolagens(dadosRolagens || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar dados:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ color: "#fff", padding: 20, textAlign: "center" }}>
        Carregando...
      </div>
    );
  }

  const renderBarra = (label, atual, max, cor, icone) => {
    const percent = Math.max(0, Math.min((atual / max) * 100, 100));
    return (
      <div style={{ marginBottom: 6 }}>
        <div
          style={{
            background: "#111",
            border: "1px solid #D4AF37",
            borderRadius: 6,
            overflow: "hidden",
            height: 22,
            fontSize: 12,
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              backgroundColor: cor,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "width 0.3s ease",
            }}
          >
            {icone} {atual} / {max}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "#000",
        color: "#D4AF37",
        minHeight: "100vh",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          maxWidth: "1600px",
          margin: "0 auto",
          height: "calc(100vh - 40px)",
          gap: 20,
        }}
      >
        <aside
          style={{
            width: "30%",
            minWidth: 300,
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          <RolagensPainel rolagens={rolagens} />
        </aside>

        <main
          style={{
            flex: 1,
            height: "100%",
            overflowY: "auto",
          }}
        >
          <h1
            style={{
              fontSize: 32,
              fontWeight: "bold",
              borderBottom: "1px solid #D4AF37",
              paddingBottom: 12,
              marginBottom: 20,
            }}
          >
            🛡️ Escudo do Mestre
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
              paddingBottom: 20,
            }}
          >
            {fichas.map((f) => {
              const pvAtual = Number(f["PV Atual"]) || 0;
              const pvMax = Number(f["PV Máx."]) || 1;
              const peAtual = Number(f["PE Atual"]) || 0;
              const peMax = Number(f["PE Máx."]) || 1;
              const sanAtual = Number(f["Sanidade Atual"]) || 0;
              const sanMax = Number(f["Sanidade Máx."]) || 1;

              return (
                <div
                  key={f.ID}
                  style={{
                    background: "#111",
                    border: "1px solid #D4AF37",
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: "0 0 8px #D4AF37",
                    boxSizing: "border-box",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: "bold" }}>
                    {f["Nome do Personagem"] || "Sem nome"}
                  </h3>
                  <p style={{ margin: "4px 0", color: "#B2955D" }}>
                    {f.Classe || "Classe desconhecida"}
                  </p>
                  <p style={{ margin: "4px 0" }}>NEX: {f.NEX || 0}%</p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      fontSize: 14,
                    }}
                  >
                    <span>AGI: {f.AGI || 0}</span>
                    <span>FOR: {f.FOR || 0}</span>
                    <span>INT: {f.INT || 0}</span>
                    <span>PRE: {f.PRE || 0}</span>
                    <span>VIG: {f.VIG || 0}</span>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    {renderBarra("VIDA", pvAtual, pvMax, "#8B0000", "❤️")}
                    {renderBarra("PE", peAtual, peMax, "#008B8B", "🔷")}
                    {renderBarra("SAN", sanAtual, sanMax, "#800080", "🧠")}
                  </div>

                  <button
                    onClick={() => setFichaSelecionada(f)}
                    style={{
                      marginTop: 10,
                      width: "100%",
                      padding: "6px 0",
                      backgroundColor: "#D4AF37",
                      color: "#000",
                      fontWeight: "bold",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Ver Ficha
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {fichaSelecionada && (
        <ModalFichaDetalhada
          ficha={fichaSelecionada}
          onClose={() => setFichaSelecionada(null)}
        />
      )}
    </div>
  );
}
