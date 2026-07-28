import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { apiGetSheet, apiPost } from "../utils/api";
import "./CarteiraSection.css";

export default function CarteiraSection({ fichaId }) {
  const [movimentos, setMovimentos] = useState([]);
  const [novo, setNovo] = useState({ tipo: "Entrada", valor: "", descricao: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const data = await apiGetSheet("Carteira");
      const lista = Array.isArray(data) ? data : [];
      setMovimentos(lista.filter((m) => String(m["ID da Ficha"]) === String(fichaId)));
      setErro("");
    } catch (error) {
      setErro(error.message || "Não foi possível carregar a carteira.");
    }
  }, [fichaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const saldo = useMemo(() => movimentos.reduce((total, movimento) => {
    const valor = Number(movimento.Valor) || 0;
    return movimento["Tipo de Movimento"] === "Entrada" ? total + valor : total - valor;
  }, 0), [movimentos]);

  const adicionarMovimento = async () => {
    const valor = Number(novo.valor);
    if (!Number.isFinite(valor) || valor <= 0 || salvando) return;
    setSalvando(true);
    try {
      const entrada = {
        "ID da Ficha": fichaId,
        "Tipo de Movimento": novo.tipo,
        Valor: valor,
        "Descrição": novo.descricao.trim(),
        "Data/Hora": new Date().toLocaleString("pt-BR"),
      };
      await apiPost("salvarCarteira", entrada);
      setMovimentos((atuais) => [...atuais, entrada]);
      setNovo({ tipo: "Entrada", valor: "", descricao: "" });
      setErro("");
    } catch (error) {
      setErro(error.message || "Não foi possível salvar a movimentação.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirMovimento = async (movimento, indice) => {
    if (!window.confirm("Deseja excluir essa movimentação?")) return;
    try {
      await apiPost("deletarCarteira", movimento);
      setMovimentos((atuais) => atuais.filter((_, i) => i !== indice));
      setErro("");
    } catch (error) {
      setErro(error.message || "Não foi possível excluir a movimentação.");
    }
  };

  return (
    <section className="wallet-section">
      <details open className="wallet-panel">
        <summary className="wallet-summary">💰 Carteira: {saldo} PI</summary>

        <div className="wallet-form">
          <select className="wallet-field wallet-field--type" value={novo.tipo} onChange={(event) => setNovo((atual) => ({ ...atual, tipo: event.target.value }))}>
            <option>Entrada</option>
            <option>Saída</option>
          </select>
          <input className="wallet-field wallet-field--value" type="number" min="0" step="0.01" value={novo.valor} onChange={(event) => setNovo((atual) => ({ ...atual, valor: event.target.value }))} placeholder="Valor" />
          <input className="wallet-field wallet-field--description" value={novo.descricao} onChange={(event) => setNovo((atual) => ({ ...atual, descricao: event.target.value }))} placeholder="Descrição" />
          <button className="wallet-add" type="button" onClick={adicionarMovimento} disabled={salvando} aria-label="Adicionar movimentação"><FaPlus /></button>
        </div>

        {erro ? <div className="wallet-error">{erro}</div> : null}

        <div className="wallet-list">
          {movimentos.map((movimento, indice) => (
            <article key={`${movimento["Data/Hora"] || "mov"}-${indice}`}>
              <div>
                <strong>{movimento["Tipo de Movimento"]}:</strong> {movimento.Valor} PI
                {movimento["Descrição"] ? <span> — {movimento["Descrição"]}</span> : null}
                <small>{movimento["Data/Hora"]}</small>
              </div>
              <button type="button" onClick={() => excluirMovimento(movimento, indice)} aria-label="Excluir movimentação"><FaTrash /></button>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
