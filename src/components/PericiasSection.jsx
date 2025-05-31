// src/components/PericiasSection.jsx

import React, { useState } from "react";
import { FaDiceD20 } from "react-icons/fa";

// 1) Copie a mesma BASE_URL que usa em FichaJogador.jsx:
const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

const LISTA_PERICIAS = [
  { nome: "Acrobacia", atributoPadrao: "AGI" },
  { nome: "Adestramento", atributoPadrao: "PRE" },
  { nome: "Artes", atributoPadrao: "PRE" },
  { nome: "Atletismo", atributoPadrao: "FOR" },
  { nome: "Atualidades", atributoPadrao: "INT" },
  { nome: "Ciências", atributoPadrao: "INT" },
  { nome: "Crime", atributoPadrao: "AGI" },
  { nome: "Diplomacia", atributoPadrao: "PRE" },
  { nome: "Enganação", atributoPadrao: "PRE" },
  { nome: "Fortitude", atributoPadrao: "VIG" },
  { nome: "Furtividade", atributoPadrao: "AGI" },
  { nome: "Intimidação", atributoPadrao: "PRE" },
  { nome: "Intuição", atributoPadrao: "PRE" },
  { nome: "Investigação", atributoPadrao: "INT" },
  { nome: "Luta", atributoPadrao: "FOR" },
  { nome: "Medicina", atributoPadrao: "INT" },
  { nome: "Ocultismo", atributoPadrao: "INT" },
  { nome: "Percepção", atributoPadrao: "PRE" },
  { nome: "Pilotagem", atributoPadrao: "AGI" },
  { nome: "Pontaria", atributoPadrao: "AGI" },
  { nome: "Profissão", atributoPadrao: "INT" },
  { nome: "Reflexos", atributoPadrao: "AGI" },
  { nome: "Religião", atributoPadrao: "INT" },
  { nome: "Sobrevivência", atributoPadrao: "VIG" },
  { nome: "Tática", atributoPadrao: "INT" },
  { nome: "Tecnologia", atributoPadrao: "INT" },
  { nome: "Vontade", atributoPadrao: "PRE" },
];

const TODOS_ATRIBUTOS = ["AGI", "FOR", "INT", "PRE", "VIG", "SOR"];

const styles = {
  container: {
    marginTop: 24,
    background: "#111111",
    border: "1px solid #D4AF37",
    borderRadius: 8,
    padding: 16,
    position: "relative",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#D4AF37",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#000000",
    border: "1px solid #D4AF37",
  },
  th: {
    border: "1px solid #D4AF37",
    borderRight: "none",
    padding: "8px",
    color: "#D4AF37",
    fontSize: 14,
    textAlign: "center",
    verticalAlign: "middle",
    background: "#111111",
  },
  thLast: {
    border: "none",
    padding: "8px",
  },
  td: {
    border: "1px solid #D4AF37",
    borderRight: "none",
    padding: "6px",
    color: "#B2955D",
    fontSize: 14,
    textAlign: "center",
    verticalAlign: "middle",
  },
  tdLast: {
    border: "none",
    padding: "6px",
  },
  select: {
    width: "100%",
    padding: 4,
    background: "#000000",
    color: "#D4AF37",
    border: "1px solid #D4AF37",
    borderRadius: 4,
  },
  input: {
    width: "100%",
    padding: 4,
    background: "transparent",
    color: "#D4AF37",
    border: "none",
    textAlign: "center",
    fontSize: 14,
  },
  rollBtn: {
    background: "transparent",
    border: "none",
    color: "#D4AF37",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
  },
  summary: {
    marginTop: 12,
    color: "#B2955D",
    fontSize: 14,
    textAlign: "right",
  },
  resultCard: {
    position: "fixed",
    right: 20,
    bottom: 20,
    background: "#1a202c",
    border: "1px solid #D4AF37",
    borderRadius: 8,
    padding: "12px 16px",
    paddingRight: 36,
    minWidth: 140,
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#D4AF37",
    zIndex: 1000,
  },
  closeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    background: "transparent",
    border: "none",
    color: "#D4AF37",
    fontSize: 13,
    cursor: "pointer",
  },
  resultIcon: { fontSize: 32 },
  resultText: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
  },
  resultName: { fontWeight: "bold", fontSize: 16 },
  resultRoll: { fontSize: 14, color: "#B2955D" },
  resultCategory: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
};

const categoryStyles = {
  Desastre: {
    color: "#DC143C",
    textShadow: "0 0 16px #DC143C, 0 0 24px #FF0000",
  },
  Fracasso: {
    color: "#8B0000",
    textShadow: "0 0 6px #8B0000",
  },
  Sucesso: {
    color: "#00FF00",
    textShadow: "0 0 12px #00FF00",
    fontSize: "20px",
  },
  "Sucesso Bom": {
    color: "#00FFFF",
    textShadow: "0 0 12px #00FFFF",
    fontSize: "18px",
  },
  "Sucesso Extremo": {
    color: "#FFFFFF",
    textShadow: "0 0 8px #00FFFF",
    fontSize: "18px",
  },
  "Sucesso Perfeito": {
    color: "#FFD700",
    textShadow: "0 0 8px #FFD700",
    fontSize: "22px",
  },
};

function categorize(roll, skill, sor) {
  if (roll === 1 && sor < 20) return "Desastre";
  const thP = 21 - Math.floor(skill / 17);
  const thE = 21 - Math.floor(skill / 5);
  const thB = 21 - Math.floor(skill / 2);
  const thN = 21 - skill;
  if (skill > 15 && roll >= thP) return "Sucesso Perfeito";
  if (roll >= thE) return "Sucesso Extremo";
  if (roll >= thB) return "Sucesso Bom";
  if (roll >= thN) return "Sucesso";
  return "Fracasso";
}

export default function PericiasSection({
  atributos,
  sor,
  nivel,
  bonusManual,
  setBonusManual,
  pontosDisponiveis,
  limitePorPericia,
  fichaId,            // ↖ Adicionado
  nomePersonagem,     // ↖ Adicionado
  registrarRolagem,   // ↖ Adicionado
}) {
  const [rollData, setRollData] = useState(null);

  // Soma total dos bônus padrões (manual)
  const totalDistrib = Object.entries(bonusManual)
    .filter(([chave]) => !chave.startsWith("extra_") && !chave.startsWith("atributo_"))
    .reduce((sum, [, valor]) => sum + valor, 0);

  const handleBonusChange = (nome, val) => {
    const atual = bonusManual[nome] || 0;
    const novoTotal = totalDistrib - atual + val;
    if (
      val >= 0 &&
      (limitePorPericia === Infinity || val <= limitePorPericia) &&
      novoTotal <= pontosDisponiveis
    ) {
      setBonusManual({ ...bonusManual, [nome]: val });
    }
  };

  const getAttr = (a) => Number(atributos[a] || 0);

  // Monta cada linha com parcial, bônus manual, extra e pool total
  const linhas = LISTA_PERICIAS.map(({ nome, atributoPadrao }) => {
    const atr = bonusManual[`atributo_${nome}`] || atributoPadrao;
    const valAtr = getAttr(atr);
    const bonus = bonusManual[nome] || 0;
    const extra = bonusManual[`extra_${nome}`] || 0;
    const parcial = Math.floor((valAtr + sor) * 0.2);
    const pool = parcial + bonus + extra;
    return { nome, atr, parcial, bonus, extra, pool };
  });

  const rolar = (nome, pool) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const category = categorize(roll, pool, sor);
    setRollData({ nome, roll, category });

    // 1) Atualiza estado local de histórico (via registrarRolagem, se presente)
    if (registrarRolagem) {
      registrarRolagem({
        horario: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        personagem: nomePersonagem,
        pericia: nome,
        valor: roll,
        tipoSucesso: category,
        estilo: categoryStyles[category] || {},
      });
    }

    // 2) Salva na planilha (aba "Rolagens") via POST
    fetch(BASE_URL, {
      method: "POST",
      body: new URLSearchParams({
        acao: "salvarRolagem",
        "ID da Ficha": fichaId,
        Horario: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        "Nome do Personagem": nomePersonagem,
        Tipo: "Perícia",
        Nome: nome,
        Valor: roll,
        "Tipo de Sucesso": category,
      }),
    }).catch((err) => {
      console.error("Erro ao salvar rolagem:", err);
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Perícias</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: "18%" }}>Perícia</th>
            <th style={{ ...styles.th, width: "12%" }}>Atributo</th>
            <th style={{ ...styles.th, width: "12%" }}>Bônus</th>
            <th style={{ ...styles.th, width: "12%" }}>Extra</th>
            <th style={{ ...styles.th, width: "18%" }}>Treinamento</th>
            <th style={{ ...styles.th, width: "14%" }}>Total P.</th>
            <th style={{ ...styles.thLast, width: "10%" }}></th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ nome, atr, parcial, bonus, extra, pool }) => (
            <tr key={nome}>
              <td style={styles.td}>{nome}</td>
              <td style={styles.td}>
                <select
                  style={styles.select}
                  value={atr}
                  onChange={(e) =>
                    setBonusManual({
                      ...bonusManual,
                      [`atributo_${nome}`]: e.target.value,
                    })
                  }
                >
                  {TODOS_ATRIBUTOS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </td>
              <td style={styles.td}>{parcial}</td>
              <td style={styles.td}>
                <input
                  type="number"
                  min={0}
                  value={extra}
                  onChange={(e) =>
                    setBonusManual({
                      ...bonusManual,
                      [`extra_${nome}`]: +e.target.value,
                    })
                  }
                  style={styles.input}
                />
              </td>
              <td style={styles.td}>
                <input
                  type="number"
                  min={0}
                  max={limitePorPericia === Infinity ? undefined : limitePorPericia}
                  value={bonus}
                  onChange={(e) => handleBonusChange(nome, +e.target.value)}
                  style={styles.input}
                />
              </td>
              <td style={styles.td}>{pool}</td>
              <td style={styles.tdLast}>
                <button
                  style={styles.rollBtn}
                  onClick={() => rolar(nome, pool)}
                >
                  <FaDiceD20 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rollData && (
        <div style={styles.resultCard}>
          <button style={styles.closeBtn} onClick={() => setRollData(null)}>
            ✕
          </button>
          <FaDiceD20 style={styles.resultIcon} />
          <div style={styles.resultText}>
            <span style={styles.resultName}>{rollData.nome}</span>
            <span style={styles.resultRoll}>[d20] → {rollData.roll}</span>
            <span
              style={{
                ...styles.resultCategory,
                ...categoryStyles[rollData.category],
              }}
            >
              {rollData.category}
            </span>
          </div>
        </div>
      )}

      <div style={styles.summary}>
        Pontos distribuídos: {totalDistrib} / {pontosDisponiveis} | Limite:{" "}
        {limitePorPericia === Infinity ? "∞" : `+${limitePorPericia}`}
      </div>
    </div>
  );
}
