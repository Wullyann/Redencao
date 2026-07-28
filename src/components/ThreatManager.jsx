import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Dices,
  ImagePlus,
  Plus,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { apiGet, apiPost } from "../utils/api";
import { uploadMediaFile } from "../utils/mediaUpload";
import SecureDriveImage from "./SecureDriveImage";

const EMPTY_ACTION = {
  id: "",
  nome: "",
  acaoNecessaria: "Padrão",
  alcance: "",
  quantidadeAtaques: 1,
  valorPericia: 0,
  dano: "",
  tipoDano: "",
  critico: "",
  efeitos: "",
};

const EMPTY_THREAT = {
  Nome: "", Imagem: "", VD: "", Tipo: "", Elemento: "", Descritores: "", Tamanho: "",
  descricaoPublica: "", notasSecretas: "", AGI: "", FOR: "", INT: "", PRE: "", VIG: "", SOR: "",
  Iniciativa: "", Percepção: "", Defesa: "", Fortitude: "", Reflexos: "", Vontade: "",
  pvMaximo: "", estadoMachucado: "", deslocamento: "", rdGeral: "", resistencias: "", imunidades: "",
  vulnerabilidades: "", sentidosEspeciais: "", pericias: "", habilidadesPassivas: "", presencaDt: "",
  presencaDanoMental: "", presencaImunidadeNex: "", enigmaDescricao: "", enigmaPistas: "",
  enigmaEstado: "Ativo", enigmaEfeitosRemovidos: "", acoes: [],
};

const FIELD_GROUPS = [
  ["Identidade", [
    ["Nome", "Nome"], ["VD", "VD"], ["Tipo", "Tipo"], ["Elemento", "Elemento"],
    ["Descritores", "Descritores"], ["Tamanho", "Tamanho"],
  ]],
  ["Atributos opcionais", [["AGI", "AGI", "number"], ["FOR", "FOR", "number"], ["INT", "INT", "number"], ["PRE", "PRE", "number"], ["VIG", "VIG", "number"], ["SOR", "SOR", "number"]]],
  ["Defesas e testes", [["Iniciativa", "Iniciativa", "number"], ["Percepção", "Percepção", "number"], ["Defesa", "Defesa", "number"], ["Fortitude", "Fortitude", "number"], ["Reflexos", "Reflexos", "number"], ["Vontade", "Vontade", "number"]]],
  ["Vitalidade e proteção", [["PV máximo", "pvMaximo", "number"], ["Estado machucado", "estadoMachucado"], ["Deslocamento", "deslocamento"], ["RD geral", "rdGeral", "number"], ["Resistências", "resistencias"], ["Imunidades", "imunidades"], ["Vulnerabilidades", "vulnerabilidades"]]],
  ["Percepção e capacidades", [["Sentidos especiais", "sentidosEspeciais"], ["Perícias", "pericias", "textarea"], ["Habilidades passivas", "habilidadesPassivas", "textarea"]]],
  ["Presença Perturbadora", [["DT", "presencaDt", "number"], ["Dano mental", "presencaDanoMental"], ["Imunidade por NEX", "presencaImunidadeNex"]]],
  ["Enigma de Medo", [["Descrição", "enigmaDescricao", "textarea"], ["Pistas", "enigmaPistas", "textarea"], ["Estado", "enigmaEstado"], ["Efeitos removidos", "enigmaEfeitosRemovidos", "textarea"]]],
];

function normalizeThreat(row) {
  if (!row) return { ...EMPTY_THREAT };
  return {
    ...row,
    descricaoPublica: row["Descrição Pública"] || "",
    notasSecretas: row["Notas Secretas"] || "",
    pvMaximo: row["PV Máximo"] || "",
    estadoMachucado: row["Estado Machucado"] || "",
    deslocamento: row.Deslocamento || "",
    rdGeral: row["RD Geral"] || "",
    resistencias: row["Resistências"] || "",
    imunidades: row.Imunidades || "",
    vulnerabilidades: row.Vulnerabilidades || "",
    sentidosEspeciais: row["Sentidos Especiais"] || "",
    pericias: row["Perícias"] || "",
    habilidadesPassivas: row["Habilidades Passivas"] || "",
    presencaDt: row["Presença DT"] || "",
    presencaDanoMental: row["Presença Dano Mental"] || "",
    presencaImunidadeNex: row["Presença Imunidade NEX"] || "",
    enigmaDescricao: row["Enigma Descrição"] || "",
    enigmaPistas: row["Enigma Pistas"] || "",
    enigmaEstado: row["Enigma Estado"] || "Ativo",
    enigmaEfeitosRemovidos: row["Enigma Efeitos Removidos"] || "",
    acoes: row.acoes || [],
  };
}

export default function ThreatManager() {
  const [threats, setThreats] = useState([]);
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [rollResult, setRollResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await apiGet({ acao: "listarAmeacas", incluirArquivadas: showArchived, incluirExcluidas: showTrash, busca: search });
      setThreats(response.ameacas || []);
    } catch (error) {
      setMessage(error.message);
    }
  }, [search, showArchived, showTrash]);

  useEffect(() => {
    const timer = window.setTimeout(load, 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => threats.filter((item) => showTrash || String(item["Excluído"]).toLowerCase() !== "true"), [threats, showTrash]);

  const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const uploadThreatImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Selecione uma imagem PNG, JPG ou WEBP.");
      return;
    }
    setImageUploading(true);
    try {
      const uploaded = await uploadMediaFile(file, {
        fileName: `ameaca_${draft?.Nome || Date.now()}_${file.name}`,
      });
      setField("Imagem", uploaded.url);
      setMessage("Imagem anexada. Salve a ameaça para confirmar.");
    } catch (error) {
      setMessage(error.message || "Não foi possível enviar a imagem.");
    } finally {
      setImageUploading(false);
    }
  };

  const save = async () => {
    if (!draft?.Nome?.trim()) {
      setMessage("A ameaça precisa de um nome.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiPost("salvarAmeaca", { ameaca: draft });
      setDraft(normalizeThreat(response.ameaca));
      setMessage("Ameaça salva.");
      load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (threat) => {
    const response = await apiPost("duplicarAmeaca", { id: threat.ID });
    setDraft(normalizeThreat(response.ameaca));
    load();
  };

  const stateAction = async (action, threat, value = true) => {
    await apiPost(action, { id: threat.ID, valor: value });
    if (draft?.ID === threat.ID) setDraft(null);
    load();
  };

  const updateAction = (index, key, value) => {
    setDraft((current) => ({ ...current, acoes: current.acoes.map((action, i) => i === index ? { ...action, [key]: value } : action) }));
  };

  const addAction = () => setDraft((current) => ({ ...current, acoes: [...(current.acoes || []), { ...EMPTY_ACTION, id: `acao_${Date.now()}` }] }));
  const removeAction = (index) => setDraft((current) => ({ ...current, acoes: current.acoes.filter((_, i) => i !== index) }));

  const rollAttack = async (threat, action, rollDamage) => {
    try {
      const response = await apiPost("rolarAtaqueAmeaca", { ameacaId: threat.ID, acaoId: action.id || action.nome, rolarDano: rollDamage });
      setRollResult(response.resultado);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="master-tool-panel threat-manager">
      <header className="master-tool-panel__header">
        <div><span>ARQUIVO SECRETO DO MESTRE</span><h2><ShieldAlert size={22} /> Ameaças</h2><p>Crie e role ameaças sem expor dados aos navegadores dos jogadores.</p></div>
        <button type="button" className="master-primary-action" onClick={() => setDraft({ ...EMPTY_THREAT, acoes: [] })}><Plus size={17} /> Nova ameaça</button>
      </header>

      <div className="threat-toolbar">
        <label><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome, tipo, elemento..." /></label>
        <button type="button" className={showArchived ? "is-active" : ""} onClick={() => setShowArchived((value) => !value)}><Archive size={16} /> Arquivadas</button>
        <button type="button" className={showTrash ? "is-active" : ""} onClick={() => setShowTrash((value) => !value)}><Trash2 size={16} /> Lixeira</button>
      </div>
      {message ? <div className="master-inline-error">{message}</div> : null}

      <div className="threat-layout">
        <div className="threat-list">
          {filtered.map((threat) => <article key={threat.ID} className={draft?.ID === threat.ID ? "is-selected" : ""} onClick={() => setDraft(normalizeThreat(threat))}>
            <div className="threat-avatar">{threat.Imagem ? <SecureDriveImage source={threat.Imagem} alt={threat.Nome || "Ameaça"} className="threat-avatar__image" /> : <ShieldAlert size={24} />}</div>
            <div><h3>{threat.Nome || "Sem nome"}</h3><span>VD {threat.VD || "—"} · {threat.Tipo || "Sem tipo"}</span><small>{threat.Elemento || "Sem elemento"}</small></div>
            <div className="threat-list-actions"><button type="button" title="Duplicar" onClick={(event) => { event.stopPropagation(); duplicate(threat); }}><Copy size={14} /></button>{String(threat["Excluído"]).toLowerCase() === "true" ? <button type="button" title="Restaurar" onClick={(event) => { event.stopPropagation(); stateAction("restaurarAmeaca", threat); }}><ArchiveRestore size={14} /></button> : <><button type="button" title={String(threat.Arquivado).toLowerCase() === "true" ? "Desarquivar" : "Arquivar"} onClick={(event) => { event.stopPropagation(); stateAction("arquivarAmeaca", threat, String(threat.Arquivado).toLowerCase() !== "true"); }}>{String(threat.Arquivado).toLowerCase() === "true" ? <ArchiveRestore size={14} /> : <Archive size={14} />}</button><button type="button" title="Lixeira" onClick={(event) => { event.stopPropagation(); stateAction("excluirAmeaca", threat, true); }}><Trash2 size={14} /></button></>}</div>
          </article>)}
          {!filtered.length ? <div className="master-empty-small"><ShieldAlert size={30} /><span>Nenhuma ameaça encontrada.</span></div> : null}
        </div>

        <div className="threat-editor">
          {!draft ? <div className="master-empty"><ShieldAlert size={38} /><h3>Selecione ou crie uma ameaça</h3><p>Todos os campos secretos permanecem exclusivos do mestre.</p></div> : <>
            <div className="threat-editor__top"><div><span>{draft.ID ? "EDITANDO AMEAÇA" : "NOVA AMEAÇA"}</span><h2>{draft.Nome || "Sem nome"}</h2></div><button type="button" onClick={() => setDraft(null)}><X size={20} /></button></div>
            <div className="threat-image-editor">
              <div className="threat-image-preview">
                {draft.Imagem ? <SecureDriveImage source={draft.Imagem} alt={draft.Nome || "Imagem da ameaça"} className="threat-image-preview__img" /> : <ShieldAlert size={42} />}
              </div>
              <div>
                <strong>Imagem da ameaça</strong>
                <p>A imagem é compactada no navegador e salva diretamente na ficha da ameaça, sem usar DriveApp.</p>
                <label className="threat-image-upload">
                  <ImagePlus size={16} /> {imageUploading ? "Enviando..." : "Escolher imagem"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" disabled={imageUploading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; uploadThreatImage(file); }} />
                </label>
                {draft.Imagem ? <button type="button" className="threat-image-remove" onClick={() => setField("Imagem", "")}><Trash2 size={14} /> Remover imagem</button> : null}
              </div>
            </div>
            <div className="threat-description-grid"><label>Descrição pública<textarea rows={5} value={draft.descricaoPublica} onChange={(event) => setField("descricaoPublica", event.target.value)} /></label><label>Notas secretas<textarea rows={5} value={draft.notasSecretas} onChange={(event) => setField("notasSecretas", event.target.value)} /></label></div>
            {FIELD_GROUPS.map(([title, fields]) => <fieldset key={title}><legend>{title}</legend><div className="threat-fields">{fields.map(([label, key, type]) => <label key={key}>{label}{type === "textarea" ? <textarea rows={3} value={draft[key] ?? ""} onChange={(event) => setField(key, event.target.value)} /> : <input type={type || "text"} value={draft[key] ?? ""} onChange={(event) => setField(key, event.target.value)} />}</label>)}</div></fieldset>)}

            <fieldset><legend>Ações e ataques</legend><div className="threat-actions">{(draft.acoes || []).map((action, index) => <article key={action.id || index}><header><strong>{action.nome || `Ação ${index + 1}`}</strong><button type="button" onClick={() => removeAction(index)}><Trash2 size={14} /></button></header><div className="threat-fields"><label>Nome<input value={action.nome} onChange={(event) => updateAction(index, "nome", event.target.value)} /></label><label>Ação necessária<input value={action.acaoNecessaria} onChange={(event) => updateAction(index, "acaoNecessaria", event.target.value)} /></label><label>Alcance<input value={action.alcance} onChange={(event) => updateAction(index, "alcance", event.target.value)} /></label><label>Quantidade de ataques<input type="number" value={action.quantidadeAtaques} onChange={(event) => updateAction(index, "quantidadeAtaques", Number(event.target.value))} /></label><label>Valor da perícia<input type="number" value={action.valorPericia} onChange={(event) => updateAction(index, "valorPericia", Number(event.target.value))} /></label><label>Dano<input value={action.dano} onChange={(event) => updateAction(index, "dano", event.target.value)} placeholder="2d8+4" /></label><label>Tipo de dano<input value={action.tipoDano} onChange={(event) => updateAction(index, "tipoDano", event.target.value)} /></label><label>Crítico<input value={action.critico} onChange={(event) => updateAction(index, "critico", event.target.value)} /></label><label className="wide">Efeitos<textarea rows={2} value={action.efeitos} onChange={(event) => updateAction(index, "efeitos", event.target.value)} /></label></div>{draft.ID ? <footer><button type="button" onClick={() => rollAttack(draft, action, false)}><Dices size={15} /> Rolar ataque</button><button type="button" onClick={() => rollAttack(draft, action, true)}><Dices size={15} /> Ataque + dano</button></footer> : null}</article>)}</div><button type="button" className="threat-add-action" onClick={addAction}><Plus size={15} /> Adicionar ação</button></fieldset>
            <div className="threat-save-bar"><button type="button" className="master-primary-action" onClick={save} disabled={saving}><Save size={17} /> {saving ? "Salvando..." : "Salvar ameaça"}</button></div>
          </>}
        </div>
      </div>

      {rollResult ? <div className="threat-roll-modal" onClick={() => setRollResult(null)}><article onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setRollResult(null)}>×</button><span>ROLAGEM SECRETA DE AMEAÇA</span><h2>{rollResult.ameaca}</h2><h3>{rollResult.acao}</h3><strong>{rollResult.categoria}</strong><p>d20 bruto: <b>{rollResult.d20}</b> · perícia {rollResult.valorPericia}</p>{rollResult.dano ? <div><em>Dano rolado</em><b>{rollResult.dano.total}</b><small>{rollResult.dano.detalhes?.join(" + ")}</small></div> : null}<small>Nenhum dano foi aplicado automaticamente.</small></article></div> : null}
    </section>
  );
}
