// src/pages/Fichas.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

export default function Fichas() {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState([]);
  const [msg, setMsg] = useState("");

  // carrega todas as fichas
  useEffect(() => {
    const dados = localStorage.getItem("usuario");
    if (!dados) return navigate("/");
    const info = JSON.parse(dados);
    if (info.tipo !== "mestre") return navigate("/ficha");

    fetch(`${BASE_URL}?sheet=Fichas`)
      .then((res) => res.json())
      .then((data) => setFichas(data))
      .catch(() => setMsg("Erro ao carregar fichas."));
  }, [navigate]);

  // ao alterar input de NEX
  const handleNexChange = (id, novoNex) => {
    setFichas((old) =>
      old.map((f) => (f.ID === id ? { ...f, NEX: novoNex } : f))
    );
  };

  // salvar NEX de uma ficha
  const salvarNex = async (ficha) => {
    setMsg("Salvando...");
    try {
      const formData = new FormData();
      formData.append("acao", "salvarFicha");
      formData.append("ID", ficha.ID);
      formData.append("NEX", ficha.NEX);

      const res = await fetch(BASE_URL, { method: "POST", body: formData });
      const json = await res.json();
      setMsg(json.mensagem || "Salvo.");
    } catch {
      setMsg("Erro ao salvar.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-4">Painel do Mestre</h2>
      {msg && <p className="mb-2">{msg}</p>}
      <table className="w-full text-sm bg-gray-800 rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-700">
            <th className="p-2 text-left">Personagem</th>
            <th className="p-2 text-left">Jogador</th>
            <th className="p-2 text-left">NEX</th>
            <th className="p-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {fichas.map((f) => (
            <tr key={f.ID} className="border-t border-gray-700">
              <td className="p-2">{f["Nome do Personagem"]}</td>
              <td className="p-2">{f["Login do Jogador"]}</td>
              <td className="p-2">
                <input
                  type="number"
                  value={f.NEX || ""}
                  min={0}
                  max={100}
                  onChange={(e) =>
                    handleNexChange(f.ID, Number(e.target.value))
                  }
                  className="w-20 p-1 bg-gray-600 rounded text-center"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() => salvarNex(f)}
                  className="px-3 py-1 bg-green-500 rounded hover:bg-green-600"
                >
                  Salvar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
