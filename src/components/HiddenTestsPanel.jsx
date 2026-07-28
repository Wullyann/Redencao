import React, { useEffect, useMemo, useState } from "react";
import { EyeOff, History, Play, RefreshCw, Users } from "lucide-react";
import { apiGet, apiPost } from "../utils/api";
import { ATRIBUTOS, PERICIAS } from "../utils/systemRules";

const CATEGORY_CLASS = {
  Desastre: "is-disaster",
  Fracasso: "is-failure",
  Sucesso: "is-success",
  "Sucesso Bom": "is-good",
  "Sucesso Extremo": "is-extreme",
  "Sucesso Perfeito": "is-perfect",
};

export default function HiddenTestsPanel({ fichas }) {
  const [all, setAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [type, setType] = useState("atributo");
  const [name, setName] = useState("AGI");
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const options = useMemo(() => type === "atributo" ? ATRIBUTOS : PERICIAS.map((skill) => skill.nome), [type]);

  useEffect(() => {
    setName(options[0] || "");
  }, [options]);

  const loadHistory = async () => {
    try {
      const response = await apiGet({ acao: "listarTestesOcultos", limite: 120 });
      setHistory(response.testes || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => { loadHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlayer = (id) => {
    setSelectedIds((current) => current.includes(String(id))
      ? current.filter((item) => item !== String(id))
      : [...current, String(id)]);
  };

  const runTests = async () => {
    if (!all && !selectedIds.length) {
      setMessage("Selecione pelo menos um jogador.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await apiPost("realizarTestesOcultos", {
        todos: all,
        fichaIds: selectedIds,
        tipo: type,
        nome: name,
      });
      setResults(response.resultados || []);
      await loadHistory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="master-tool-panel hidden-tests-panel">
      <header className="master-tool-panel__header">
        <div><span>SEM AVISO AOS JOGADORES</span><h2><EyeOff size={22} /> Testes Ocultos</h2><p>Os resultados ficam somente aqui e nunca entram no histórico público de Rolagens.</p></div>
      </header>

      <div className="hidden-tests-grid">
        <div className="hidden-tests-config">
          <h3><Users size={17} /> Alvos</h3>
          <label className="master-check"><input type="checkbox" checked={all} onChange={(event) => setAll(event.target.checked)} /> Todos os jogadores</label>
          {!all ? <div className="hidden-player-list">{fichas.map((ficha) => <label key={ficha.ID}><input type="checkbox" checked={selectedIds.includes(String(ficha.ID))} onChange={() => togglePlayer(ficha.ID)} /><span>{ficha["Nome do Personagem"] || "Sem nome"}</span><small>{ficha["Login do Jogador"]}</small></label>)}</div> : null}

          <h3>Teste</h3>
          <div className="master-field-row">
            <label>Tipo<select value={type} onChange={(event) => setType(event.target.value)}><option value="atributo">Atributo</option><option value="pericia">Perícia</option></select></label>
            <label>{type === "atributo" ? "Atributo" : "Perícia"}<select value={name} onChange={(event) => setName(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
          </div>
          <button type="button" className="master-primary-action" onClick={runTests} disabled={loading}><Play size={17} /> {loading ? "Realizando..." : "Realizar testes"}</button>
          {message ? <div className="master-inline-error">{message}</div> : null}
        </div>

        <div className="hidden-tests-results">
          <h3>Resultado do último lote</h3>
          {results.length ? <div className="hidden-result-list">{results.map((result) => <article key={result.id} className={CATEGORY_CLASS[result.categoria] || ""}><div><strong>{result.personagem}</strong><span>{result.tipo} · {result.nome} · valor {result.valor}</span></div><b>{result.categoria}</b><em>d20: {result.d20}</em></article>)}</div> : <div className="master-empty-small"><EyeOff size={30} /><span>Nenhum teste realizado nesta tela.</span></div>}
        </div>
      </div>

      <div className="hidden-tests-history">
        <div className="master-section-title"><div><History size={18} /><h2>Histórico secreto</h2></div><button type="button" onClick={loadHistory}><RefreshCw size={15} /> Atualizar</button></div>
        <div className="hidden-history-table"><table><thead><tr><th>Data</th><th>Personagem</th><th>Teste</th><th>Valor</th><th>d20</th><th>Categoria</th><th>Mestre</th></tr></thead><tbody>{history.map((item) => <tr key={item.ID}><td>{new Date(item.Data).toLocaleString("pt-BR")}</td><td>{item.Personagem}</td><td>{item.Tipo} · {item.Nome}</td><td>{item["Valor da Perícia"]}</td><td>{item.d20}</td><td><strong className={CATEGORY_CLASS[item.Categoria] || ""}>{item.Categoria}</strong></td><td>{item.Mestre}</td></tr>)}</tbody></table></div>
      </div>
    </section>
  );
}
