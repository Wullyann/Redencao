import React from "react";

const categoryStyles = {
  Desastre: { color: "#DC143C", textShadow: "0 0 8px #DC143C" },
  Fracasso: { color: "#8B0000", textShadow: "0 0 6px #8B0000" },
  Sucesso: {
    color: "#00FF00",
    textShadow: "0 0 12px #00FF00",
    fontWeight: "bold",
  },
  "Sucesso Bom": {
    color: "#00FFFF",
    textShadow: "0 0 12px #00FFFF",
    fontWeight: "bold",
  },
  "Sucesso Extremo": {
    color: "#FFFFFF",
    textShadow: "0 0 12px #FFFFFF",
    fontWeight: "bold",
  },
  "Sucesso Perfeito": {
    color: "#FFD700",
    textShadow: "0 0 12px #FFD700",
    fontWeight: "bold",
  },
};

function formatarHorario(valor) {
  if (!valor) return "—";
  try {
    const date = new Date(valor);
    if (isNaN(date)) return valor;
    const horas = String(date.getHours()).padStart(2, "0");
    const minutos = String(date.getMinutes()).padStart(2, "0");
    const segundos = String(date.getSeconds()).padStart(2, "0");
    return `${horas}:${minutos}:${segundos}`;
  } catch {
    return valor;
  }
}

export default function RolagensPainel({ rolagens }) {
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #D4AF37",
        borderRadius: 12,
        padding: 16,
        height: "100%",
        overflowY: "auto",
        boxShadow: "0 0 6px #D4AF37",
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 16,
          borderBottom: "1px solid #D4AF37",
          paddingBottom: 8,
          color: "#D4AF37",
        }}
      >
        🎲 Rolagens Recentes
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rolagens
          .slice()
          .reverse()
          .map((r, idx) => (
            <div
              key={idx}
              style={{
                background: "#222",
                border: "1px solid #555",
                borderRadius: 8,
                padding: 10,
                fontSize: 13,
                color: "#D4AF37",
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontWeight: "bold" }}>
                {r["Nome do Personagem"] || "—"}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#999",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                🕒 {formatarHorario(r.Horário)}
              </div>

              <div style={{ marginTop: 4 }}>
                <strong>Tipo:</strong> {r.Tipo} | <strong>Nome:</strong> {r.Nome}
              </div>
              <div>
                <strong>Valor:</strong> {r.Valor}
              </div>
              <div>
                <strong>Resultado:</strong>{" "}
                <span style={categoryStyles[r["Tipo de Sucesso"]] || {}}>
                  {r["Tipo de Sucesso"] || "—"}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
