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

  if (!usuario) {
    return <div className="p-6 text-white">Carregando...</div>;
  }

  const sair = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-xl mx-auto bg-gray-900 rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Painel do Mestre</h1>
        <p className="mb-2">Bem-vindo, <strong>{usuario.nome}</strong></p>
        <p className="mb-4 text-sm text-gray-400">Tipo de acesso: {usuario.tipo}</p>

        <div className="space-y-2">
          <button
            onClick={() => navigate("/fichas")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded"
          >
            Visualizar/Editar Fichas
          </button>

            <button
            onClick={() => navigate("/criar-ficha")}
            className="w-full bg-green-600 hover:bg-green-700 py-2 px-4 rounded"
            >
            Criar Nova Ficha
            </button>


          <button
            onClick={sair}
            className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
