import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec"; // substitua com sua URL real

export default function CriarFicha() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [form, setForm] = useState({
    personagem: "",
    jogador: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const dados = localStorage.getItem("usuario");
    if (!dados) return navigate("/");
    const info = JSON.parse(dados);
    if (info.tipo !== "mestre") return navigate("/ficha");
    setUsuario(info);
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("Criando ficha e usuário...");

    try {
      const formData = new FormData();
      formData.append("acao", "criarFichaComUsuario");
      formData.append("personagem", form.personagem);
      formData.append("jogador", form.jogador);

      const response = await fetch(BASE_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status === "sucesso") {
        setMsg("Ficha e usuário criados com sucesso!");
        setForm({ personagem: "", jogador: "" });
      } else {
        setMsg(data.mensagem || "Erro ao criar.");
      }
    } catch (err) {
      setMsg("Erro de conexão.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">Criar Acesso de Ficha</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="personagem"
            placeholder="Nome do Personagem"
            value={form.personagem}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700"
            required
          />
          <input
            name="jogador"
            placeholder="Usuário do Jogador"
            value={form.jogador}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700"
            required
          />

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 py-2 rounded"
          >
            Criar Ficha
          </button>
        </form>

        {msg && <p className="mt-4 text-center">{msg}</p>}
      </div>
    </div>
  );
}
