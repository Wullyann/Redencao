// src/components/RollResultPopup.jsx
import React, { useEffect } from "react";
import { FaDiceD20 } from "react-icons/fa";

export default function RollResultPopup({ data, onClose, categoryStyles }) {
  // fecha automaticamente após 3 segundos
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(onClose, 30000);
    return () => clearTimeout(timer);
  }, [data, onClose]);

  if (!data) return null;

  return (
    <div style={{
      position: "fixed",
      right: 20,
      bottom: 20,
      background: "#1a202c",
      border: "1px solid #D4AF37",
      borderRadius: 8,
      padding: 16,
      color: "#D4AF37",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <FaDiceD20 style={{ fontSize: 32 }} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <strong style={{ fontSize: 16 }}>{data.nome}</strong>
        <span style={{ fontSize: 14, color: "#B2955D" }}>[d20] → {data.roll}</span>
        <span style={{
          fontSize: 18,
          fontWeight: "bold",
          ...(categoryStyles[data.category] || {})
        }}>
          {data.category}
        </span>
      </div>
      <button
        onClick={onClose}
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
    </div>
  );
}
