import React, { useEffect, useState } from "react";
import { Archive, ClipboardList, ExternalLink, Plus, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";

export default function InvestigationAdminPanel() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ nome: "", descricao: "" });
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const response = await apiGet({ acao: "listarInvestigacoes" });
      setItems(response.investigacoes || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    if (!draft.nome.trim()) return;
    try {
      await apiPost("salvarInvestigacao", { investigacao: { nome: draft.nome, descricao: draft.descricao } });
      setDraft({ nome: "", descricao: "" });
      setMessage("Investigação criada.");
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const update = async (item, updates) => {
    try {
      await apiPost("salvarInvestigacao", { investigacao: { ...item, ...updates } });
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="master-tool-panel investigation-admin-panel">
      <header className="master-tool-panel__header"><div><span>ADMINISTRAÇÃO DO MURAL</span><h2><ClipboardList size={22} /> Investigações</h2><p>Jogadores acessam apenas o quadro permitido. Criação e arquivamento ficam aqui.</p></div><button type="button" className="master-primary-action" onClick={() => navigate("/investigacao")}><ExternalLink size={17} /> Abrir quadro</button></header>
      {message ? <div className="master-inline-error">{message}</div> : null}
      <div className="investigation-admin-create"><label>Nome<input value={draft.nome} onChange={(event) => setDraft((current) => ({ ...current, nome: event.target.value }))} placeholder="Nova investigação" /></label><label>Descrição<input value={draft.descricao} onChange={(event) => setDraft((current) => ({ ...current, descricao: event.target.value }))} placeholder="Objetivo do mural" /></label><button type="button" onClick={create}><Plus size={16} /> Criar</button></div>
      <div className="investigation-admin-list">{items.map((item) => <article key={item.ID}><div><h3>{item.Nome}</h3><p>{item["Descrição"] || "Sem descrição"}</p><small>ID: {item.ID}</small></div><label>Nome<input defaultValue={item.Nome} onBlur={(event) => event.target.value !== item.Nome && update(item, { Nome: event.target.value })} /></label><button type="button" onClick={() => update(item, { Arquivada: String(item.Arquivada).toLowerCase() !== "true" })}>{String(item.Arquivada).toLowerCase() === "true" ? <Save size={16} /> : <Archive size={16} />}{String(item.Arquivada).toLowerCase() === "true" ? "Restaurar" : "Arquivar"}</button></article>)}</div>
    </section>
  );
}
