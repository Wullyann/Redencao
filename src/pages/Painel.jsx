import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, FilePlus2, LogOut, Shield, Users } from "lucide-react";
import { apiPost, clearSession, getStoredUser } from "../utils/api";

export default function Painel() {
  const navigate = useNavigate();
  const [usuario] = useState(() => getStoredUser());

  useEffect(() => {
    if (!usuario) navigate("/");
    else if (usuario.tipo !== "mestre") navigate("/ficha");
  }, [navigate, usuario]);

  const sair = async () => {
    try { await apiPost("logout"); } catch { /* encerra localmente */ }
    clearSession();
    navigate("/");
  };

  if (!usuario) return <div style={{ color: "#fff", padding: 24 }}>Carregando...</div>;

  const actions = [
    ["Acessar Escudo do Mestre", "Agentes, NEX, testes ocultos, ameaças e investigações", Shield, "/escudo"],
    ["Visualizar / Editar Fichas", "Acesso direto às fichas dos jogadores", Users, "/fichas"],
    ["Criar Nova Ficha", "Atributos começam automaticamente em 5", FilePlus2, "/criar-ficha"],
    ["Quadro de Investigação", "Abrir mural compartilhado", ClipboardList, "/investigacao"],
  ];

  return <main style={styles.page}><section style={styles.card}><span style={styles.kicker}>PAINEL ADMINISTRATIVO</span><h1 style={styles.title}>Redenção</h1><p style={styles.subtitle}>Mestre conectado: <strong>{usuario.nome}</strong></p><div style={styles.grid}>{actions.map(([title, description, Icon, route]) => <button key={route} type="button" onClick={() => navigate(route)} style={styles.action}><Icon size={22} /><span><strong>{title}</strong><small>{description}</small></span></button>)}</div><button type="button" onClick={sair} style={styles.logout}><LogOut size={17} /> Encerrar sessão</button></section></main>;
}

const styles = {
  page: { background: "radial-gradient(circle at top,#1a160b,#050504 55%,#000)", minHeight: "100vh", color: "#d4af37", padding: 24, display: "grid", placeItems: "center" },
  card: { width: "min(780px,95vw)", background: "rgba(14,13,10,.94)", border: "1px solid rgba(212,175,55,.42)", borderRadius: 16, padding: 30, boxShadow: "0 25px 90px #000" },
  kicker: { display: "block", textAlign: "center", letterSpacing: ".2em", color: "#967d32", fontSize: 10 },
  title: { fontFamily: "Georgia,serif", fontSize: 38, margin: "6px 0", textAlign: "center", color: "#e8c85d" },
  subtitle: { textAlign: "center", color: "#8f8b80", marginBottom: 24 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 },
  action: { textAlign: "left", padding: 16, background: "#0a0907", color: "#d8bd5c", border: "1px solid #332c19", borderRadius: 10, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" },
  logout: { marginTop: 18, width: "100%", padding: 11, background: "#210e0e", color: "#ff8585", border: "1px solid #5f2424", borderRadius: 8, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 },
};
