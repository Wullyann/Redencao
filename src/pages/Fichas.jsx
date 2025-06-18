// src/pages/EscudoDoMestre.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

const ATRIBUTOS = ["AGI", "FOR", "INT", "PRE", "VIG", "SOR"];

export default function EscudoDoMestre() {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}?sheet=Fichas`)
      .then((r) => r.json())
      .then((data) => {
        setFichas(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (id, campo, valor) => {
    setFichas((old) =>
      old.map((f) => (f.ID === id ? { ...f, [campo]: valor } : f))
    );
  };

  const salvarCampo = (id, campo, valor) => {
    const params = new URLSearchParams();
    params.append("acao", "salvarFicha");
    params.append("ID", id);
    params.append(campo, valor);
    fetch(BASE_URL, { method: "POST", body: params })
      .then((r) => r.json())
      .catch(console.error);
  };

  if (loading) {
    return (
      <div style={{
        background: "#000",
        color: "#D4AF37",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{
      background: "#000",
      color: "#D4AF37",
      minHeight: "100vh",
      padding: 20,
      boxSizing: "border-box"
    }}>
      <h1 style={{
        fontSize: 32,
        fontWeight: "bold",
        borderBottom: "1px solid #D4AF37",
        paddingBottom: 12,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 8
      }}>
        🛡️ Escudo do Mestre
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 20
      }}>
        {fichas.map((f) => {
          const modPV = Number(f["Mod. PV Máx."]) || 0;
          const modPE = Number(f["Mod. PE Máx."]) || 0;
          const modSAN = Number(f["Mod. SAN Máx."]) || 0;

          return (
            <div key={f.ID} style={{
              background: "#111",
              border: "1px solid #D4AF37",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 0 8px #D4AF37",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              {/* Header */}
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: "bold" }}>
                  {f["Nome do Personagem"]}
                </h3>
                <p style={{ margin: "4px 0", color: "#B2955D" }}>
                  {f.Classe}
                </p>
                <p style={{ margin: "4px 0" }}>
                  NEX: {f.NEX || 0}%
                </p>

                {/* Atributos */}
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 8,
                  fontSize: 14
                }}>
                  {ATRIBUTOS.map((attr) => (
                    <span key={attr}>
                      {attr}: {f[attr] || 0}
                    </span>
                  ))}
                </div>

                {/* Modificadores */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginTop: 16
                }}>
                  {[
                    ["PV +", modPV, "Mod. PV Máx."],
                    ["PE +", modPE, "Mod. PE Máx."],
                    ["SAN +", modSAN, "Mod. SAN Máx."]
                  ].map(([label, value, campo]) => (
                    <div key={campo} style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ fontSize: 12, marginBottom: 4 }}>{label}</label>
                      <input
                        type="number"
                        defaultValue={value}
                        onBlur={(e) => {
                          const v = Number(e.target.value) || 0;
                          handleChange(f.ID, campo, v);
                          salvarCampo(f.ID, campo, v);
                        }}
                        style={{
                          width: "100%",
                          padding: "6px",
                          background: "#000",
                          color: "#D4AF37",
                          border: "1px solid #D4AF37",
                          borderRadius: 6,
                          fontWeight: "bold",
                          textAlign: "center"
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão Ver Ficha */}
              <button
                onClick={() => navigate(`/ficha?id=${f.ID}`)}
                style={{
                  marginTop: 20,
                  padding: "8px 0",
                  backgroundColor: "#D4AF37",
                  color: "#000",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
              >
                Ver Ficha
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
