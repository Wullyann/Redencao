import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Coloque aqui sua URL final da Web App do Google Apps Script
const BASE_URL = "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      const formData = new FormData();
      formData.append("acao", "login");
      formData.append("usuario", usuario);
      formData.append("senha", senha);

      const response = await fetch(BASE_URL, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("🛠️ Resposta da API:", text);
      const data = JSON.parse(text);

      if (data.status === "sucesso") {
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        navigate("/painel");
      } else {
        setErro(data.mensagem || "Usuário ou senha inválidos.");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setErro("Erro ao conectar com o servidor.");
    }
  };

  // Cores preto e dourado
  const styles = {
    page: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      margin: 0,
      backgroundColor: "#000",
    },
    form: {
      backgroundColor: "#111",
      padding: "2rem",
      borderRadius: "1rem",
      width: "20rem",
      boxShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
    },
    title: {
      margin: 0,
      marginBottom: "1.5rem",
      textAlign: "center",
      color: "#FFD700",
      fontSize: "1.5rem",
      fontWeight: "bold",
    },
    input: {
      width: "100%",
      padding: "0.75rem",
      marginBottom: "1rem",
      backgroundColor: "#000",
      color: "#FFD700",
      border: "1px solid #FFD700",
      borderRadius: "0.5rem",
      fontSize: "1rem",
    },
    error: {
      color: "#FF6B6B",
      marginBottom: "1rem",
      fontSize: "0.875rem",
    },
    button: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#FFD700",
      color: "#000",
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      fontWeight: "bold",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={styles.title}>Login</h2>

        <input
          type="text"
          placeholder="Usuário"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          style={styles.input}
        />

        {erro && <div style={styles.error}>{erro}</div>}

        <button type="submit" style={styles.button}>
          Entrar
        </button>
      </form>
    </div>
  );
}
