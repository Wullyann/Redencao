// src/components/DescricaoSection.jsx
import React from "react";

export default function DescricaoSection({ campoNotas, setCampoNotas, campoAnotacoes, setCampoAnotacoes }) {
  return (
    <div style={{ maxWidth: 600 }}>
      <label>Descrição / Background:</label>
      <textarea
        rows={4}
        value={campoNotas}
        onChange={e => setCampoNotas(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      />
      <label>Marcadores do Mestre:</label>
      <textarea
        rows={2}
        value={campoAnotacoes}
        onChange={e => setCampoAnotacoes(e.target.value)}
        style={{ width: "100%" }}
      />
    </div>
  );
}
