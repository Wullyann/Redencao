import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Shield } from "lucide-react";
import { getStoredSession, login, storeSession } from "../utils/api";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getStoredSession();
    if (session?.token) navigate(session.usuario?.tipo === "mestre" ? "/painel" : "/ficha", { replace: true });
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const data = await login(usuario, senha);
      storeSession(data);
      navigate(data.usuario?.tipo === "mestre" ? "/painel" : "/ficha");
    } catch (error) {
      setErro(error.message || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <form onSubmit={handleLogin} style={styles.form}>
        <div style={styles.mark}><Shield size={30} /></div>
        <p style={styles.kicker}>SISTEMA REDENÇÃO</p>
        <h1 style={styles.title}>Acesso à campanha</h1>
        <p style={styles.notice}>Após a Atualização 13, todos precisam sair e entrar novamente para receber o token de sessão.</p>
        <label style={styles.label}>Usuário<input type="text" value={usuario} onChange={(event) => setUsuario(event.target.value)} required autoComplete="username" style={styles.input} /></label>
        <label style={styles.label}>Senha<input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} required autoComplete="current-password" style={styles.input} /></label>
        {erro ? <div style={styles.error}>{erro}</div> : null}
        <button type="submit" style={styles.button} disabled={loading}><KeyRound size={17} /> {loading ? "Autenticando..." : "Entrar"}</button>
      </form>
    </main>
  );
}

const styles = {
  page: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20, background: "radial-gradient(circle at 50% 20%, #1c180c 0, #080806 42%, #000 100%)", color: "#eee" },
  form: { background: "linear-gradient(145deg,#15130e,#0b0a08)", padding: "2rem", borderRadius: "1rem", width: "min(24rem, 92vw)", border: "1px solid rgba(212,175,55,.45)", boxShadow: "0 25px 80px rgba(0,0,0,.75),0 0 30px rgba(212,175,55,.12)" },
  mark: { width: 58, height: 58, borderRadius: 16, display: "grid", placeItems: "center", margin: "0 auto 12px", color: "#e4c34f", border: "1px solid #5c4b1b", background: "#090806" },
  kicker: { margin: 0, textAlign: "center", color: "#9f8432", letterSpacing: ".2em", fontSize: 10 },
  title: { margin: "6px 0 10px", textAlign: "center", color: "#e8c85d", fontFamily: "Georgia,serif", fontSize: 27 },
  notice: { margin: "0 0 20px", textAlign: "center", color: "#8f8b81", fontSize: 12, lineHeight: 1.5 },
  label: { display: "grid", gap: 6, marginBottom: 12, color: "#b9ac83", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" },
  input: { width: "100%", boxSizing: "border-box", padding: ".8rem", background: "#050504", color: "#f0e6c6", border: "1px solid #4b3f1c", borderRadius: ".5rem", fontSize: "1rem", outline: 0 },
  error: { color: "#ff8989", background: "#241010", border: "1px solid #5e2424", borderRadius: 7, padding: 9, marginBottom: 12, fontSize: ".82rem" },
  button: { width: "100%", padding: ".8rem", background: "linear-gradient(135deg,#e4c34f,#ae8925)", color: "#080704", border: "none", borderRadius: ".5rem", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 },
};
