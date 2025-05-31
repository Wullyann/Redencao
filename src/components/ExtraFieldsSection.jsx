import React from "react";

export default function ExtraFieldsSection({
  campoA,
  setCampoA,
  campoB,
  setCampoB,
}) {
  return (
    <div
      style={{
        marginBottom: 28,
        padding: 12,
        border: "1px solid #D4AF37",
        borderRadius: 4,
        background: "#111",
      }}
    >
      <label style={{ color: "#D4AF37", display: "block", marginBottom: 4 }}>
        Campo A
      </label>
      <input
        type="text"
        value={campoA}
        onChange={(e) => setCampoA(e.target.value)}
        style={{
          width: "100%",
          padding: "6px 8px",
          borderRadius: 4,
          border: "1px solid #D4AF37",
          background: "#000",
          color: "#D4AF37",
          marginBottom: 12,
        }}
      />

      <label style={{ color: "#D4AF37", display: "block", marginBottom: 4 }}>
        Campo B
      </label>
      <input
        type="number"
        value={campoB}
        onChange={(e) => setCampoB(e.target.value)}
        style={{
          width: "100%",
          padding: "6px 8px",
          borderRadius: 4,
          border: "1px solid #D4AF37",
          background: "#000",
          color: "#D4AF37",
        }}
      />
    </div>
  );
}
