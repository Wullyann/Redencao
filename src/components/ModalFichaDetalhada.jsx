// src/components/ModalFichaDetalhada.jsx
import React from "react";

export default function ModalFichaDetalhada({ ficha, onClose }) {
  if (!ficha) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111",
          border: "1px solid #D4AF37",
          borderRadius: 12,
          padding: 24,
          width: "90%",
          maxWidth: 600,
          color: "#D4AF37",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 14,
            background: "transparent",
            border: "none",
            color: "#D4AF37",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
          {ficha["Nome do Personagem"] || "Ficha Detalhada"}
        </h2>

        <p>
          <strong>Classe:</strong> {ficha.Classe || "—"} —{" "}
          {ficha.Origem || "—"}
        </p>
        <p>
          <strong>NEX:</strong> {ficha.NEX || 0}%
        </p>
        <p>
          <strong>AGI:</strong> {ficha.AGI} | <strong>FOR:</strong> {ficha.FOR} |{" "}
          <strong>INT:</strong> {ficha.INT} | <strong>PRE:</strong> {ficha.PRE} |{" "}
          <strong>VIG:</strong> {ficha.VIG} | <strong>SOR:</strong> {ficha.SOR}
        </p>
        <p>
          <strong>VIDA:</strong> {ficha["PV Atual"]} / {ficha["PV Máx."]}
        </p>
        <p>
          <strong>DETERMINAÇÃO:</strong> {ficha["PE Atual"]} /{" "}
          {ficha["PE Máx."]}
        </p>
        <p>
          <strong>SAN:</strong> {ficha["Sanidade Atual"]} /{" "}
          {ficha["Sanidade Máx."]}
        </p>
        <p>
          <strong>Defesa:</strong> {ficha.Defesa || 0} |{" "}
          <strong>Bloqueio:</strong> {ficha.Bloqueio || 0} |{" "}
          <strong>Esquiva:</strong> {ficha.Esquiva || 0}
        </p>
        <p>
          <strong>Deslocamento:</strong> {ficha["Deslocamento"] || "—"} |{" "}
          <strong>PE/Turno:</strong> {ficha["PE por Turno"] || "—"}
        </p>
      </div>
    </div>
  );
}
