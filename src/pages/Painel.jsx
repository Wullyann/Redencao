import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Painel() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const dados = localStorage.getItem("usuario");
    if (!dados) {
      navigate("/");
    } else {
      const info = JSON.parse(dados);
      if (info.tipo !== "mestre") {
        navigate("/ficha");
      } else {
        setUsuario(info);
      }
    }
  }, [navigate]);

  const sair = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  if (!usuario) {
    return <div style={{ color: "#fff", padding: 24 }}>Carregando...</div>;
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh", color: "#D4AF37", padding: 24 }}>
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          background: "#111",
          border: "2px solid #D4AF37",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 0 16px #D4AF37",
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 8, textAlign: "center" }}> Escudo do Mestre</h1>
        <p style={{ textAlign: "center", color: "#aaa", marginBottom: 24 }}>
          Acesso concedido a <strong>{usuario.nome}</strong>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => navigate("/escudo")}
            style={botaoEstilo("#FFD700", "#000")}
          >
             Acessar Escudo do Mestre
          </button>

          <button
            onClick={() => navigate("/fichas")}
            style={botaoEstilo("#6366f1")}
          >
             Visualizar / Editar Fichas
          </button>

          <button
            onClick={() => navigate("/criar-ficha")}
            style={botaoEstilo("#22c55e")}
          >
             Criar Nova Ficha
          </button>

          <button
            onClick={sair}
            style={botaoEstilo("#ef4444")}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

function botaoEstilo(bg, color = "#fff") {
  return {
    padding: "12px 16px",
    backgroundColor: bg,
    color: color,
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 16,
    boxShadow: "0 0 8px rgba(255, 255, 255, 0.1)",
    transition: "0.3s",
  };
}
