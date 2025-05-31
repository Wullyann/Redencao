// src/components/RolagensSection.jsx
import React, { useEffect, useState } from "react";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

const categoryStyles = {
  Desastre:   { color: "#DC143C", textShadow: "0 0 16px #DC143C, 0 0 24px #FF0000" },
  Fracasso:   { color: "#8B0000", textShadow: "0 0 6px #8B0000" },
  Sucesso:    { color: "#00FF00", textShadow: "0 0 12px #00FF00", fontSize: "20px" },
  "Sucesso Bom":     { color: "#00FFFF", textShadow: "0 0 12px #00FFFF", fontSize: "18px" },
  "Sucesso Extremo": { color: "#FFFFFF", textShadow: "0 0 8px #00FFFF", fontSize: "18px" },
  "Sucesso Perfeito":{ color: "#FFD700", textShadow: "0 0 8px #FFD700", fontSize: "22px" },
};

export default function RolagensSection({ fichaId }) {
  const [rolagens, setRolagens] = useState([]);

  useEffect(() => {
    if (!fichaId) return;

    function fetchRolagens() {
      fetch(`${BASE_URL}?sheet=Rolagens`)
        .then((res) => res.json())
        .then((dados) => {
          const filtradas = dados
            .filter((r) => r["ID da Ficha"] === fichaId)
            .sort((a, b) => (b.Horario || "").localeCompare(a.Horario));
          setRolagens(filtradas);
        })
        .catch((err) => console.error("Erro ao carregar rolagens:", err));
    }

    // Busca inicial e depois a cada 10 segundos
    fetchRolagens();
    const intervalo = setInterval(fetchRolagens, 10000);
    return () => clearInterval(intervalo);
  }, [fichaId]);

  return (
    <>
      {/* Bloco de <style> para customizar o scrollbar */}
      <style>
        {`
        /* === WebKit-based browsers (Chrome, Safari, Edge) === */
        .rolagens-container::-webkit-scrollbar {
          width: 8px;               /* espessura da scrollbar */
        }
        .rolagens-container::-webkit-scrollbar-track {
          background: transparent;  /* trilha (fundo) transparente */
        }
        .rolagens-container::-webkit-scrollbar-thumb {
          background-color: #444;   /* cor do “polegar” (thumb) */
          border-radius: 4px;       /* cantos arredondados */
          border: 2px solid #111;   /* borda escura ao redor */
        }
        .rolagens-container::-webkit-scrollbar-thumb:hover {
          background-color: #555;   /* cor ao passar o mouse */
        }

        /* === Firefox === */
        .rolagens-container {
          scrollbar-width: thin;            /* scrollbar mais fina */
          scrollbar-color: #444 transparent;/* thumb #444, trilha transparente */
        }
        `}
      </style>

      <div
        style={{
          background: "#111",
          border: "1px solid #D4AF37",
          borderRadius: 8,
          padding: 16,
          color: "#D4AF37",
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>📜 Histórico de Rolagens</h2>

        {rolagens.length === 0 ? (
          <p style={{ color: "#999" }}>Nenhuma rolagem registrada.</p>
        ) : (
          <div
            className="rolagens-container"
            style={{
              maxHeight: "400px",   // altura máxima do bloco (pode ajustar)
              overflowY: "auto",    // rolagem vertical habilitada
              paddingRight: 8,      // espaço para evitar sobrepor o texto
            }}
          >
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {rolagens.map((r, i) => (
                <li
                  key={i}
                  style={{
                    marginBottom: 14,
                    padding: 12,
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: 6,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#aaa", marginBottom: 6 }}>
                    {r.Horario} — <em>{r["Nome do Personagem"]}</em>
                  </div>
                  <div style={{ fontSize: 15, marginBottom: 6 }}>
                    <strong>{r.Nome}</strong> ({r.Tipo}): <strong>{r.Valor}</strong>
                  </div>
                  <div
                    style={{
                      ...categoryStyles[r["Tipo de Sucesso"]],
                      fontWeight: "bold",
                    }}
                  >
                    {r["Tipo de Sucesso"]}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
