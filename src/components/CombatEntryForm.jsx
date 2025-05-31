// src/components/CombatEntryForm.jsx
import React, { useState, useEffect } from "react";
import { FaDiceD20 } from "react-icons/fa";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

const defaultEntry = () => ({
  id: null,
  name: "",
  damage: "1d4",
  critThreshold: 20,
  critMultiplier: 2,
  attackBonus: 0,
  damageType: "",
  range: "",
  skill: "",
  damageAttribute: "",
  usesAmmo: false,
  ammoLoaded: 0,
  ammoTotal: 0,
  ammoReserve: 0,
});

// parse XdY+Z, allow 'd6' as '1d6'
function parseDamage(formula) {
  try {
    const [dicePart, bonusPart] = formula.split("+");
    const [countStr, facesStr] = dicePart.toLowerCase().split("d");
    let count = parseInt(countStr, 10);
    if (isNaN(count) || count < 1) count = 1;
    const faces = parseInt(facesStr, 10) || 6;
    const rolls = Array.from({ length: count }, () =>
      Math.floor(Math.random() * faces) + 1
    );
    const subtotal = rolls.reduce((a, b) => a + b, 0);
    const bonus = bonusPart ? parseInt(bonusPart, 10) : 0;
    return { rolls, total: subtotal + (bonus || 0) };
  } catch {
    return { rolls: [], total: 0 };
  }
}

export default function CombatEntryForm({ fichaId }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!fichaId) return;
    fetch(`${BASE_URL}?sheet=Combates`)
      .then((r) => r.json())
      .then((dados) => {
        const ataquesDoJogador = dados.filter(
          (a) => String(a["ID da Ficha"]) === String(fichaId)
        );
        const ataquesCompletos = ataquesDoJogador.map((a, i) => ({
          id: Date.now() + i,
          name: a["Nome Ataque"] || "",
          damage: a["Dano"] || "1d4",
          critThreshold: +a["Crítico"] || 20,
          critMultiplier: +a["Multiplicador"] || 2,
          attackBonus: +a["Bônus Ataque"] || 0,
          damageType: a["Tipo Dano"] || "",
          range: a["Alcance"] || "",
          skill: a["Perícia"] || "",
          damageAttribute: a["Atributo Dano"] || "",
          usesAmmo: a["Usa Munição"] === "Sim",
          ammoLoaded: +a["Carregado"] || 0,
          ammoTotal: +a["Capacidade"] || 0,
          ammoReserve: +a["Reserva"] || 0,
        }));
        setEntries(ataquesCompletos);
      })
      .catch((err) => console.error("Erro ao carregar ataques:", err));
  }, [fichaId]);

  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [popup, setPopup] = useState(null);
  const [freeRoll, setFreeRoll] = useState("");

  const salvarAtaque = async (entry) => {
    const form = new URLSearchParams();
    form.append("acao", "salvarAtaque");
    form.append("ID da Ficha", fichaId);
    form.append("Nome Ataque", entry.name);
    form.append("Dano", entry.damage);
    form.append("Crítico", entry.critThreshold);
    form.append("Multiplicador", entry.critMultiplier);
    form.append("Bônus Ataque", entry.attackBonus);
    form.append("Tipo Dano", entry.damageType);
    form.append("Alcance", entry.range);
    form.append("Perícia", entry.skill);
    form.append("Atributo Dano", entry.damageAttribute);
    form.append("Usa Munição", entry.usesAmmo ? "Sim" : "Não");
    form.append("Carregado", entry.ammoLoaded);
    form.append("Capacidade", entry.ammoTotal);
    form.append("Reserva", entry.ammoReserve);

    await fetch(BASE_URL, {
      method: "POST",
      body: form,
    });
  };

  // Deleta o ataque no Sheets
  const deleteAttack = async (entry) => {
    const form = new URLSearchParams();
    form.append("acao", "deletarAtaque");
    form.append("sheet", "Combates");
    form.append("ID da Ficha", fichaId);
    form.append("Nome Ataque", entry.name);
    await fetch(BASE_URL, {
      method: "POST",
      body: form,
    });
  };

  const handleChange = (field, value) =>
    setEditing((e) => ({ ...e, [field]: value }));

  const saveEntry = () => {
    if (!editing.name) return;
    const entry = { ...editing, id: editing.id || Date.now() };
    setEntries((list) =>
      list.some((x) => x.id === entry.id)
        ? list.map((x) => (x.id === entry.id ? entry : x))
        : [entry, ...list]
    );
    salvarAtaque(entry);
    setEditing(null);
  };

  // Remove local e no Sheets
  const removeEntry = async (id) => {
    const entry = entries.find((x) => x.id === id);
    if (!entry) return;
    await deleteAttack(entry);
    setEntries((list) => list.filter((x) => x.id !== id));
  };

  const rollDamage = (entry) => {
    const { rolls, total } = parseDamage(entry.damage);
    if (entry.usesAmmo && entry.ammoLoaded > 0) {
      setEntries((list) =>
        list.map((x) =>
          x.id === entry.id
            ? { ...x, ammoLoaded: x.ammoLoaded - 1 }
            : x
        )
      );
    }
    setPopup({ name: entry.name, rolls, final: total });
  };

  const doFreeRoll = () => {
    const formula = freeRoll.trim();
    if (!formula) return;
    const { rolls, total } = parseDamage(formula);
    setPopup({ name: `Rolagem livre (${formula})`, rolls, final: total });
    setFreeRoll("");
  };

  const reload = (entry) => {
    const loadCount = Math.min(entry.ammoTotal, entry.ammoReserve);
    setEntries((list) =>
      list.map((x) =>
        x.id === entry.id
          ? { ...x, ammoLoaded: loadCount, ammoReserve: x.ammoReserve - loadCount }
          : x
      )
    );
  };

  return (
    <div style={container}>
      {/* Rolagem livre */}
      <div style={freeRollContainer}>
        <input
          type="text"
          placeholder="Rolar dados (ex: d6,2d8+3)"
          value={freeRoll}
          onChange={(e) => setFreeRoll(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doFreeRoll()}
          style={rollInput}
        />
        <FaDiceD20 onClick={doFreeRoll} style={rollIcon} />
      </div>

      {/* Novo Ataque */}
      {!editing && (
        <button onClick={() => setEditing(defaultEntry())} style={btnNew}>
          Novo Ataque
        </button>
      )}

      {/* Formulário de Ataque */}
      {editing && (
        <div style={formBox}>
          <h3 style={formTitle}>
            {editing.id ? "Editar Ataque" : "Novo Ataque"}
          </h3>
          <div style={gridTwo}>
            <Field label="Nome*">
              <input
                value={editing.name}
                onChange={(e) => handleChange("name", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Dano*">
              <input
                value={editing.damage}
                onChange={(e) => handleChange("damage", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Crítico*">
              <input
                type="number"
                value={editing.critThreshold}
                onChange={(e) => handleChange("critThreshold", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Multiplicador Crítico*">
              <input
                type="number"
                value={editing.critMultiplier}
                onChange={(e) => handleChange("critMultiplier", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Bônus Ataque">
              <input
                type="number"
                value={editing.attackBonus}
                onChange={(e) => handleChange("attackBonus", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Tipo Dano">
              <input
                value={editing.damageType}
                onChange={(e) => handleChange("damageType", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Alcance">
              <input
                value={editing.range}
                onChange={(e) => handleChange("range", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Perícia">
              <input
                value={editing.skill}
                onChange={(e) => handleChange("skill", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Atributo Dano">
              <input
                value={editing.damageAttribute}
                onChange={(e) => handleChange("damageAttribute", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Usa Munição?">
              <input
                type="checkbox"
                checked={editing.usesAmmo}
                onChange={(e) => handleChange("usesAmmo", e.target.checked)}
              />
            </Field>
            {editing.usesAmmo && (
              <>
                <Field label="Carregado/Cap.">
                  <div style={ammoContainer}>
                    <input
                      type="number"
                      value={editing.ammoLoaded}
                      onChange={(e) => handleChange("ammoLoaded", e.target.value)}
                      style={smallInput}
                    />
                    <span style={sep}>/</span>
                    <input
                      type="number"
                      value={editing.ammoTotal}
                      onChange={(e) => handleChange("ammoTotal", e.target.value)}
                      style={smallInput}
                    />
                  </div>
                </Field>
                <Field label="Reserva">
                  <input
                    type="number"
                    value={editing.ammoReserve}
                    onChange={(e) => handleChange("ammoReserve", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </>
            )}
            <div style={gridSpanTwo}>
              <button onClick={saveEntry} style={btnSave}>
                Salvar
              </button>
              <button onClick={() => setEditing(null)} style={btnCancel}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Entradas */}
      {entries.map((entry) => (
        <div key={entry.id} style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span
              onClick={() =>
                setExpandedId(expandedId === entry.id ? null : entry.id)
              }
              style={caretStyle}
            >
              ▾
            </span>
            <strong style={entryName}>{entry.name}</strong>
            <span style={badge}>Dano: {entry.damage}</span>
            <FaDiceD20
              onClick={() => rollDamage(entry)}
              style={diceIcon}
            />
            {entry.usesAmmo && (
              <>
                <span style={ammo}>
                  {entry.ammoLoaded}/{entry.ammoTotal}
                </span>
                <span style={reserve}>[{entry.ammoReserve}]</span>
                {entry.ammoLoaded === 0 && (
                  <button
                    onClick={() => reload(entry)}
                    style={btnReload}
                  >
                    Recarregar
                  </button>
                )}
              </>
            )}
          </div>
          {expandedId === entry.id && (
            <div style={cardDetail}>
              {["attackBonus","damageType","range","skill","damageAttribute"].map((f) => (
                <p key={f} style={detail}>
                  {labels[f]}: {entry[f] || "-"}
                </p>
              ))}
              <div style={actionsRow}>
                <button onClick={() => removeEntry(entry.id)} style={btnRemove}>
                  Remover
                </button>
                <button onClick={() => setEditing(entry)} style={btnEdit}>
                  Editar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Popup de Rolagem */}
      {popup && (
        <div style={popupStyle}>
          <button onClick={() => setPopup(null)} style={popupClose}>
            ✕
          </button>
          <FaDiceD20 style={popupIcon} />
          <div>
            <div style={popupTitle}>{popup.name}</div>
            <div style={popupRolls}>Rolagens: {popup.rolls.join(", ")}</div>
            <div style={popupTotal}>Total: {popup.final}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// labels map
const labels = {
  attackBonus: "Bônus Ataque",
  damageType: "Tipo Dano",
  range: "Alcance",
  skill: "Perícia",
  damageAttribute: "Atributo Dano",
};

// Field helper
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 8 }}>
    <label style={{ color: "#B2955D", fontSize: 14 }}>{label}</label>
    {children}
  </div>
);

// styles
const container = {
  background: "#111",
  border: "1px solid #D4AF37",
  borderRadius: 8,
  padding: 16,
};
const freeRollContainer = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
};
const rollInput = {
  flex: 1,
  padding: 6,
  background: "transparent",
  border: "1px solid #D4AF37",
  borderRadius: 4,
  color: "#D4AF37",
};
const rollIcon = { cursor: "pointer", color: "#D4AF37", marginLeft: 8 };
const btnNew = {
  background: "#D4AF37",
  color: "#000",
  padding: "8px 12px",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  marginBottom: 16,
};
const formBox = { background: "#000", padding: 12, borderRadius: 6, marginBottom: 24 };
const formTitle = { color: "#fff", marginBottom: 12 };
const gridTwo = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const inputStyle = {
  width: "100%",
  padding: 6,
  background: "#000",
  color: "#D4AF37",
  border: "1px solid #D4AF37",
  borderRadius: 4,
  marginTop: 4,
};
const smallInput = {
  width: 60,
  padding: 6,
  background: "#000",
  color: "#D4AF37",
  border: "1px solid #D4AF37",
  borderRadius: 4,
  marginTop: 4,
};
const ammoContainer = { display: "flex", alignItems: "center", gap: 4 };
const sep = { margin: "0 4px", color: "#B2955D" };
const btnSave = {
  flex: 1,
  padding: "8px 0",
  background: "#D4AF37",
  color: "#000",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
const btnCancel = {
  flex: 1,
  padding: "8px 0",
  background: "#555",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
const gridSpanTwo = { gridColumn: "span 2", display: "flex", gap: 8, marginTop: 12 };
const cardStyle = {
  background: "#1a202c",
  border: "1px solid #D4AF37",
  borderRadius: 6,
  marginBottom: 12,
  overflow: "hidden",
};
const cardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  padding: "8px 12px",
  color: "#fff",
};
const caretStyle = { cursor: "pointer", transition: "transform 0.2s" };
const entryName = { marginLeft: 8, flex: 1 };
const badge = { marginLeft: 12, color: "#D4AF37", fontWeight: "bold" };
const diceIcon = { marginLeft: 12, cursor: "pointer", color: "#D4AF37" };
const ammo = { marginLeft: 12, color: "#D4AF37", fontWeight: "bold" };
const reserve = { marginLeft: 4, color: "#D4AF37", fontWeight: "bold" };
const btnReload = {
  marginLeft: 12,
  background: "#D4AF37",
  color: "#000",
  border: "none",
  borderRadius: 4,
  padding: "4px 8px",
  cursor: "pointer",
};
const cardDetail = { padding: "8px 12px" };
const detail = { margin: 0, color: "#B2955D" };
const actionsRow = { display: "flex", gap: 12, marginTop: 8 };
const btnRemove = { background: "transparent", border: "none", color: "#dc2626", cursor: "pointer" };
const btnEdit = { background: "transparent", border: "none", color: "#22c55e", cursor: "pointer" };
const popupStyle = {
  position: "fixed",
  right: 20,
  bottom: 20,
  background: "#1a202c",
  border: "1px solid #D4AF37",
  borderRadius: 6,
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#D4AF37",
  zIndex: 1000,
};
const popupClose = {
  position: "absolute",
  top: 4,
  right: 4,
  background: "transparent",
  border: "none",
  color: "#D4AF37",
  cursor: "pointer",
};
const popupIcon = { fontSize: 24, color: "#D4AF37" };
const popupTitle = { color: "#fff", fontWeight: "bold" };
const popupRolls = { color: "#B2955D" };
const popupTotal = { color: "#D4AF37", fontWeight: "bold" };
