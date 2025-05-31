// src/components/HabilidadesSection.jsx
import React, { useState, useEffect } from 'react';
const BASE_URL = "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

const ELEMENTS = ['Sangue', 'Energia', 'Conhecimento', 'Morte', 'Medo'];
const elementStyles = {
  Sangue:        { background: '#dc2626', color: '#fff', border: '#dc2626' },
  Energia:      { background: '#7F3FBF', color: '#fff', border: '#7F3FBF' },
  Conhecimento: { background: '#D4AF37', color: '#000', border: '#D4AF37' },
  Morte:        { background: '#000',    color: '#fff', border: '#000' },
  Medo:         { background: '#fff',    color: '#000', border: '#fff' },
};

function CustomDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const style = elementStyles[value] || {};
  return (
    <div style={styles.dropdownContainer}>
      <div
        style={{
          ...styles.dropdownHeader,
          background: style.background || '#000',
          color:      style.color      || '#D4AF37',
          borderColor: style.border    || '#D4AF37',
        }}
        onClick={() => setOpen(o => !o)}
      >
        {value || '—'}
      </div>
      {open && (
        <div style={styles.dropdownList}>
          {options.map(opt => (
            <div
              key={opt}
              style={{
                ...styles.dropdownItem,
                background: elementStyles[opt].background,
                color:      elementStyles[opt].color,
              }}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const defaultForm = () => ({
  name:         '',
  description:  '',
  element:      '',
  prerequisite: '',
  peCost:       '',
});

export default function HabilidadesSection({ fichaId, initialSkills = [], onSave, onRemove }) {
  const [skills, setSkills]         = useState(initialSkills);
  const [filter, setFilter]         = useState('');
  const [isAdding, setIsAdding]     = useState(false);
  const [form, setForm]             = useState(defaultForm());
  const [editingIdx, setEditingIdx] = useState(null);

  useEffect(() => {
    if (!fichaId) return;
    fetch(`${BASE_URL}?sheet=Habilidades`)
      .then(r => r.json())
      .then(data => {
        const rows = data.filter(r => String(r["ID da Ficha"]) === String(fichaId));
        setSkills(rows.map(r => ({
          name:         r["Nome da Habilidade"] || '',
          description:  r["Descrição"]           || '',
          element:      r["Elemento"]            || '',
          prerequisite: r["Pré-requisito"]       || '',
          peCost:       r["Custo (PE)"]          || '',
        })));
      })
      .catch(console.error);
  }, [fichaId]);

  const saveToSheet = async entry => {
    const form = new URLSearchParams();
    form.append("acao", "salvarHabilidade");
    form.append("sheet", "Habilidades");
    form.append("ID da Ficha", entry["ID da Ficha"]);
    form.append("Nome da Habilidade", entry.name);
    form.append("Descrição", entry.description);
    form.append("Elemento", entry.element);
    form.append("Pré-requisito", entry.prerequisite);
    form.append("Custo (PE)", entry.peCost);
    await fetch(BASE_URL, { method: "POST", body: form });
  };

  const deleteFromSheet = async entry => {
    const form = new URLSearchParams();
    form.append("acao", "deletarHabilidade");
    form.append("sheet", "Habilidades");
    form.append("ID da Ficha", fichaId);
    form.append("Nome da Habilidade", entry.name);
    await fetch(BASE_URL, { method: "POST", body: form });
  };

  const handleSave = async () => {
  if (!fichaId) {
    ;
  }

  if (editingIdx !== null) {
    await deleteFromSheet(skills[editingIdx]);
  }

  const finalData = {
    ...form,
    "ID da Ficha": fichaId
  };

  await saveToSheet(finalData);

  const newList = editingIdx !== null
    ? skills.map((s, i) => i === editingIdx ? form : s)
    : [...skills, form];

  setSkills(newList);
  onSave?.(newList);
  cancelEdit();
};


  const cancelEdit = () => {
    setForm(defaultForm());
    setIsAdding(false);
    setEditingIdx(null);
  };

  const startEdit = idx => {
    setEditingIdx(idx);
    setForm({ ...skills[idx], "ID da Ficha": fichaId });
    setIsAdding(true);
  };

  const removeSkill = async idx => {
    const entry = skills[idx];
    if (!entry) return;
    await deleteFromSheet(entry);
    const newList = skills.filter((_, i) => i !== idx);
    setSkills(newList);
    onRemove?.(newList);
  };

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* filtro e botão */}
      <div style={styles.headerRow}>
        <input
          style={styles.filterInput}
          type="text"
          placeholder="Filtrar habilidades"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <button
          style={styles.btnAdd}
          onClick={() => {
            setIsAdding(true);
            setEditingIdx(null);
            setForm(defaultForm());
          }}
        >
          + Nova
        </button>
      </div>

      {/* formulário inline */}
      {isAdding && (
        <div style={styles.formBox}>
          <h3 style={styles.formTitle}>
            {editingIdx !== null ? 'Editar Habilidade' : 'Nova Habilidade'}
          </h3>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Nome*</label>
              <input
                style={styles.fieldInput}
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Descrição*</label>
              <textarea
                style={styles.textarea}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Elemento</label>
              <CustomDropdown
                options={ELEMENTS}
                value={form.element}
                onChange={val => setForm({ ...form, element: val })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Pré-requisito</label>
              <input
                style={styles.fieldInput}
                type="text"
                value={form.prerequisite}
                onChange={e => setForm({ ...form, prerequisite: e.target.value })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Custo (PE)</label>
              <input
                style={styles.fieldInput}
                type="number"
                min="0"
                value={form.peCost}
                onChange={e => setForm({ ...form, peCost: e.target.value })}
              />
            </div>
          </div>
          <div style={styles.actions}>
            <button style={styles.btnSave} onClick={handleSave}>Salvar</button>
            <button style={styles.btnCancel} onClick={cancelEdit}>Cancelar</button>
          </div>
        </div>
      )}

      {/* lista de habilidades */}
      {filtered.map((h, idx) => (
        <SkillCard
          key={idx}
          skill={h}
          onEdit={() => startEdit(idx)}
          onRemove={() => removeSkill(idx)}
        />
      ))}
    </div>
  );
}

function SkillCard({ skill, onEdit, onRemove }) {
  const [open, setOpen] = useState(false);
  const stylesElem = elementStyles[skill.element] || {};
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader} onClick={() => setOpen(v => !v)}>
        <span style={styles.caret}>{open ? '▾' : '▸'}</span>
        <strong style={styles.cardTitle}>{skill.name}</strong>
      </div>
      {open && (
        <>
          <div style={styles.goldenBar} />
          <div style={styles.cardBody}>
            <p style={styles.cardText}>{skill.description}</p>
            {skill.element && (
              <span style={{
                ...styles.badge,
                background: stylesElem.background,
                color:      stylesElem.color,
              }}>
                {skill.element}
              </span>
            )}
            {skill.prerequisite && (
              <p style={styles.cardText}><b>Pré:</b> {skill.prerequisite}</p>
            )}
            {skill.peCost && (
              <p style={styles.cardText}><b>PE:</b> {skill.peCost}</p>
            )}
            <div style={styles.actionsRow}>
              <button onClick={onRemove} style={styles.btnRemove}>Remover</button>
              <button onClick={onEdit} style={styles.btnEdit}>Editar</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: '#111',
    border: '1px solid #D4AF37',
    borderRadius: 8,
    padding: 16,
  },
  headerRow: {
    display: 'flex',
    marginBottom: 12,
  },
  filterInput: {
    flex: 1,
    padding: 6,
    background: 'transparent',
    border: '1px solid #D4AF37',
    borderRadius: 4,
    color: '#D4AF37',
    marginRight: 8,
  },
  btnAdd: {
    background: '#D4AF37',
    border: 'none',
    borderRadius: 4,
    padding: '6px 12px',
    cursor: 'pointer',
    color: '#000',
  },
  formBox: {
    background: '#000',
    border: '1px solid #D4AF37',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  formTitle: {
    color: '#fff',
    marginBottom: 8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  fieldFull: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    color: '#B2955D',
    marginBottom: 4,
    fontSize: 14,
  },
  fieldInput: {
    padding: 6,
    background: '#000',
    border: '1px solid #D4AF37',
    borderRadius: 4,
    color: '#D4AF37',
  },
  textarea: {
    minHeight: 60,
    padding: 6,
    background: '#000',
    border: '1px solid #D4AF37',
    borderRadius: 4,
    color: '#D4AF37',
  },
  actions: {
    marginTop: 12,
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  btnSave: {
    background: '#D4AF37',
    border: 'none',
    borderRadius: 4,
    padding: '6px 16px',
    cursor: 'pointer',
    color: '#000',
  },
  btnCancel: {
    background: '#555',
    border: 'none',
    borderRadius: 4,
    padding: '6px 16px',
    cursor: 'pointer',
    color: '#fff',
  },
  card: {
    background: '#1a202c',
    border: '1px solid #D4AF37',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    cursor: 'pointer',
    color: '#fff',
  },
  caret: {
    marginRight: 8,
    color: '#D4AF37',
  },
  cardTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
  },
  goldenBar: {
    height: 2,
    background: '#D4AF37',
    margin: '0 12px',
  },
  cardBody: {
    padding: '8px 12px',
  },
  cardText: {
    color: '#fff',
    margin: '4px 0',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 4,
    margin: '4px 0',
  },
  actionsRow: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  btnRemove: {
    background: 'transparent',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
  },
  btnEdit: {
    background: 'transparent',
    border: 'none',
    color: '#22c55e',
    cursor: 'pointer',
  },
  dropdownContainer: {
    position: 'relative',
    width: '100%',
  },
  dropdownHeader: {
    padding: '6px 8px',
    border: '1px solid',
    borderRadius: 4,
    cursor: 'pointer',
    userSelect: 'none',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#000',
    border: '1px solid #D4AF37',
    borderRadius: 4,
    marginTop: 4,
    zIndex: 10,
    maxHeight: 160,
    overflowY: 'auto',
  },
  dropdownItem: {
    padding: '6px 8px',
    cursor: 'pointer',
  },
};
