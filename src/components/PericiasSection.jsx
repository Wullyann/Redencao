import React, { useMemo, useState } from "react";
import { ChevronDown, Dices, Search, SlidersHorizontal, X } from "lucide-react";
import { FaDiceD20 } from "react-icons/fa";
import { publicarRolagemPortrait } from "../utils/portraitRealtime";

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

const categoryStyles = {
  Desastre: { color: "#ff3b5c", textShadow: "0 0 18px rgba(255,59,92,.75)" },
  Fracasso: { color: "#ff6b6b", textShadow: "0 0 12px rgba(255,107,107,.35)" },
  Sucesso: { color: "#55e98f", textShadow: "0 0 14px rgba(85,233,143,.4)" },
  "Sucesso Bom": { color: "#5de1ff", textShadow: "0 0 14px rgba(93,225,255,.45)" },
  "Sucesso Extremo": { color: "#f7fbff", textShadow: "0 0 15px rgba(93,225,255,.6)" },
  "Sucesso Perfeito": { color: "#f7c948", textShadow: "0 0 18px rgba(247,201,72,.65)" },
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
  bonusManual,
  setBonusManual,
  pontosDisponiveis,
  limitePorPericia,
  fichaId,
  nomePersonagem,
  registrarRolagem,
}) {
  const [rollData, setRollData] = useState(null);
  const [busca, setBusca] = useState("");
  const [atributoFiltro, setAtributoFiltro] = useState("TODOS");
  const [somenteTreinadas, setSomenteTreinadas] = useState(false);

  const totalDistrib = Object.entries(bonusManual)
    .filter(([chave]) => !chave.startsWith("extra_") && !chave.startsWith("atributo_"))
    .reduce((sum, [, valor]) => sum + Number(valor || 0), 0);

  const handleBonusChange = (nome, val) => {
    const atual = Number(bonusManual[nome] || 0);
    const novoTotal = totalDistrib - atual + val;
    if (
      val >= 0 &&
      (limitePorPericia === Infinity || val <= limitePorPericia) &&
      novoTotal <= pontosDisponiveis
    ) {
      setBonusManual({ ...bonusManual, [nome]: val });
    }
  };

  const getAttr = (atributo) => Number(atributos[atributo] || 0);

  const linhas = useMemo(
    () =>
      LISTA_PERICIAS.map(({ nome, atributoPadrao }) => {
        const atr = bonusManual[`atributo_${nome}`] || atributoPadrao;
        const valAtr = getAttr(atr);
        const bonus = Number(bonusManual[nome] || 0);
        const extra = Number(bonusManual[`extra_${nome}`] || 0);
        const parcial = Math.floor((valAtr + sor) * 0.2);
        const pool = parcial + bonus + extra;
        return { nome, atr, parcial, bonus, extra, pool };
      }),
    [bonusManual, atributos, sor]
  );

  const linhasFiltradas = linhas.filter((linha) => {
    const correspondeBusca = linha.nome.toLowerCase().includes(busca.trim().toLowerCase());
    const correspondeAtributo = atributoFiltro === "TODOS" || linha.atr === atributoFiltro;
    const correspondeTreino = !somenteTreinadas || linha.bonus > 0 || linha.extra > 0;
    return correspondeBusca && correspondeAtributo && correspondeTreino;
  });

  const rolar = (nome, pool) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const category = categorize(roll, pool, sor);
    const horario = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setRollData({ nome, roll, category });
    publicarRolagemPortrait({
      fichaId,
      tipo: "Perícia",
      nome,
      valor: roll,
      tipoSucesso: category,
    });

    registrarRolagem?.({
      horario,
      personagem: nomePersonagem,
      pericia: nome,
      valor: roll,
      tipoSucesso: category,
      estilo: categoryStyles[category] || {},
    });

    fetch(BASE_URL, {
      method: "POST",
      body: new URLSearchParams({
        acao: "salvarRolagem",
        "ID da Ficha": fichaId,
        Horario: horario,
        "Nome do Personagem": nomePersonagem,
        Tipo: "Perícia",
        Nome: nome,
        Valor: roll,
        "Tipo de Sucesso": category,
      }),
    }).catch(console.error);
  };

  return (
    <section className="play-section-card skills-section">
      <div className="play-section-heading skills-heading">
        <div>
          <span className="play-eyebrow">TESTES E ESPECIALIZAÇÕES</span>
          <h2>Perícias</h2>
          <p>Encontre uma perícia, ajuste o treinamento e role sem sair da tela.</p>
        </div>
        <div className="skills-budget">
          <span>Pontos distribuídos</span>
          <strong>{totalDistrib}<em>/ {pontosDisponiveis}</em></strong>
          <small>Limite por perícia: {limitePorPericia === Infinity ? "∞" : `+${limitePorPericia}`}</small>
        </div>
      </div>

      <div className="skills-toolbar">
        <label className="skills-search">
          <Search size={17} />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar perícia..."
          />
          {busca && <button type="button" onClick={() => setBusca("")}><X size={15} /></button>}
        </label>

        <label className="skills-filter-select">
          <SlidersHorizontal size={16} />
          <select value={atributoFiltro} onChange={(event) => setAtributoFiltro(event.target.value)}>
            <option value="TODOS">Todos os atributos</option>
            {TODOS_ATRIBUTOS.map((atributo) => <option key={atributo} value={atributo}>{atributo}</option>)}
          </select>
          <ChevronDown size={15} />
        </label>

        <button
          type="button"
          className={`skills-trained-toggle ${somenteTreinadas ? "is-active" : ""}`}
          onClick={() => setSomenteTreinadas((value) => !value)}
        >
          <Dices size={16} /> Somente treinadas
        </button>
      </div>

      <div className="skills-table-wrap">
        <table className="skills-table">
          <thead>
            <tr>
              <th>Perícia</th>
              <th>Atributo</th>
              <th>Base</th>
              <th>Extra</th>
              <th>Treino</th>
              <th>Total</th>
              <th aria-label="Rolar" />
            </tr>
          </thead>
          <tbody>
            {linhasFiltradas.map(({ nome, atr, parcial, bonus, extra, pool }) => (
              <tr key={nome}>
                <td data-label="Perícia"><strong>{nome}</strong></td>
                <td data-label="Atributo">
                  <select
                    value={atr}
                    onChange={(event) =>
                      setBonusManual({
                        ...bonusManual,
                        [`atributo_${nome}`]: event.target.value,
                      })
                    }
                  >
                    {TODOS_ATRIBUTOS.map((atributo) => (
                      <option key={atributo} value={atributo}>{atributo}</option>
                    ))}
                  </select>
                </td>
                <td data-label="Base"><span className="skills-number-muted">{parcial}</span></td>
                <td data-label="Extra">
                  <input
                    type="number"
                    min={0}
                    value={extra}
                    onChange={(event) =>
                      setBonusManual({
                        ...bonusManual,
                        [`extra_${nome}`]: +event.target.value,
                      })
                    }
                  />
                </td>
                <td data-label="Treino">
                  <input
                    type="number"
                    min={0}
                    max={limitePorPericia === Infinity ? undefined : limitePorPericia}
                    value={bonus}
                    onChange={(event) => handleBonusChange(nome, +event.target.value)}
                  />
                </td>
                <td data-label="Total"><strong className="skills-total">{pool}</strong></td>
                <td className="skills-roll-cell">
                  <button type="button" onClick={() => rolar(nome, pool)} title={`Rolar ${nome}`}>
                    <FaDiceD20 /><span>Rolar</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {linhasFiltradas.length === 0 && (
          <div className="skills-empty">
            <Search size={24} />
            <strong>Nenhuma perícia encontrada</strong>
            <span>Remova algum filtro ou tente outra busca.</span>
          </div>
        )}
      </div>

      {rollData && (
        <div className="play-roll-toast skills-roll-toast">
          <button type="button" onClick={() => setRollData(null)} aria-label="Fechar resultado">×</button>
          <div className="play-roll-die"><FaDiceD20 /><strong>{rollData.roll}</strong></div>
          <div className="play-roll-copy">
            <span>ROLAGEM DE PERÍCIA</span>
            <strong>{rollData.nome}</strong>
            <b style={categoryStyles[rollData.category]}>{rollData.category}</b>
          </div>
        </div>
      )}
    </section>
  );
}
