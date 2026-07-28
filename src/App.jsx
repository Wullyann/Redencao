import React, { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Painel from "./pages/Painel";
import FichaJogador from "./pages/FichaJogador";
import EscudoDoMestre from "./pages/EscudoDoMestre";
import CriarFicha from "./pages/CriarFicha";
import Fichas from "./pages/Fichas";
import Portrait from "./pages/Portrait";
import InvestigationBoard from "./pages/InvestigationBoard";
import { getStoredSession } from "./utils/api";

function RequireSession({ children }) {
  const location = useLocation();
  const session = getStoredSession();
  if (!session?.token || !session?.usuario) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function RequireMaster({ children }) {
  const session = getStoredSession();
  if (!session?.token || !session?.usuario) return <Navigate to="/" replace />;
  if (session.usuario.tipo !== "mestre") return <Navigate to="/ficha" replace />;
  return children;
}

export default function App() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleExpired = () => navigate("/", { replace: true });
    window.addEventListener("redencao:session-expired", handleExpired);
    return () => window.removeEventListener("redencao:session-expired", handleExpired);
  }, [navigate]);

  return <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/painel" element={<RequireMaster><Painel /></RequireMaster>} />
    <Route path="/ficha" element={<RequireSession><FichaJogador /></RequireSession>} />
    <Route path="/criar-ficha" element={<RequireMaster><CriarFicha /></RequireMaster>} />
    <Route path="/fichas" element={<RequireMaster><Fichas /></RequireMaster>} />
    <Route path="/escudo" element={<RequireMaster><EscudoDoMestre /></RequireMaster>} />
    <Route path="/investigacao" element={<RequireSession><InvestigationBoard /></RequireSession>} />
    <Route path="/portrait/:id" element={<Portrait />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
