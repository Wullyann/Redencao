// src/components/CarteiraSection.jsx
import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

export default function CarteiraSection({ fichaId }) {
  const [movimentos, setMovimentos] = useState([]);
  const [novo, setNovo] = useState({ tipo: "Entrada", valor: "", descricao: "" });

  useEffect(() => {
    fetch(`${BASE_URL}?sheet=Carteira`)
      .then((r) => r.json())
      .then((data) => {
        const lista = data || [];
        const filtrados = lista.filter((m) => String(m["ID da Ficha"]) === String(fichaId));
        setMovimentos(filtrados);
      })
      .catch((err) => console.error("Erro ao carregar carteira:", err));
  }, [fichaId]);

  const saldo = movimentos.reduce((total, m) => {
    const val = Number(m.Valor) || 0;
    return m["Tipo de Movimento"] === "Entrada" ? total + val : total - val;
  }, 0);

  const adicionarMovimento = () => {
    if (!novo.valor || isNaN(novo.valor)) return;

    const entrada = {
      "ID da Ficha": fichaId,
      "Tipo de Movimento": novo.tipo,
      Valor: novo.valor,
      Descrição: novo.descricao,
      "Data/Hora": new Date().toLocaleString("pt-BR"),
    };

    const params = new URLSearchParams();
    Object.entries(entrada).forEach(([k, v]) => params.append(k, v));
    params.append("acao", "salvarCarteira");

    fetch(BASE_URL, {
      method: "POST",
      body: params,
    })
      .then(() => {
        setMovimentos([...movimentos, entrada]);
        setNovo({ tipo: "Entrada", valor: "", descricao: "" });
      })
      .catch((err) => console.error("Erro ao salvar movimento:", err));
  };

  const excluirMovimento = (idx) => {
    const mov = movimentos[idx];
    if (!window.confirm("Deseja excluir essa movimentação?")) return;

    const params = new URLSearchParams();
    Object.entries(mov).forEach(([k, v]) => params.append(k, v));
    params.append("acao", "deletarCarteira");

    fetch(BASE_URL, {
      method: "POST",
      body: params,
    })
      .then(() => {
        const novaLista = [...movimentos];
        novaLista.splice(idx, 1);
        setMovimentos(novaLista);
      })
      .catch((err) => console.error("Erro ao excluir movimento:", err));
  };

  return (
    <div style={{ padding: 0 }}>
      <details
        open
        style={{
          border: "2px solid #D4AF37",
          borderRadius: 8,
          background: "#000",
          color: "#D4AF37",
          padding: 16,
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 18,
            color: "#D4AF37",
            listStyle: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>💰 Carteira: {saldo} Pl</span>
        </summary>

        <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 16 }}>
          <select
            value={novo.tipo}
            onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}
            style={{ padding: 6, background: "#111", color: "#D4AF37", border: "1px solid #D4AF37" }}
          >
            <option>Entrada</option>
            <option>Saída</option>
          </select>
          <input
            type="number"
            value={novo.valor}
            onChange={(e) => setNovo({ ...novo, valor: e.target.value })}
            placeholder="Valor"
            style={{ width: 100, padding: 6, background: "#111", color: "#D4AF37", border: "1px solid #D4AF37" }}
          />
          <input
            value={novo.descricao}
            onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
            placeholder="Descrição"
            style={{ flex: 1, padding: 6, background: "#111", color: "#D4AF37", border: "1px solid #D4AF37" }}
          />
          <button
            onClick={adicionarMovimento}
            style={{ background: "#D4AF37", color: "#000", padding: "6px 12px", border: "none", borderRadius: 4 }}
          >
            <FaPlus />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {movimentos.map((m, idx) => (
            <div
              key={idx}
              style={{
                background: "#111",
                border: "1px solid #555",
                padding: 10,
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <div>
                <strong>{m["Tipo de Movimento"]}:</strong> {m.Valor} Pl — {m.Descrição}
                <br />
                <span style={{ fontSize: 11, color: "#888" }}>{m["Data/Hora"]}</span>
              </div>
              <button
                onClick={() => excluirMovimento(idx)}
                style={{ background: "none", border: "none", color: "#D4AF37", cursor: "pointer" }}
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
