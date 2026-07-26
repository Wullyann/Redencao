import React, { useState } from "react";
import { Brain, Footprints, Heart, Minus, Plus, Zap } from "lucide-react";

const STATUS = [
  { key: "pv", label: "Vida", short: "PV", icon: Heart, color: "#ff425d" },
  { key: "san", label: "Sanidade", short: "SAN", icon: Brain, color: "#8c6cff" },
  { key: "pe", label: "Esforço", short: "PE", icon: Zap, color: "#f7b733" },
];

export default function VitalStatsSection({
  pvAtual,
  pvMax,
  peAtual,
  peMax,
  sanAtual,
  sanMax,
  setPvAtual,
  setPeAtual,
  setSanAtual,
  agi,
  vig,
}) {
  const [modificadores, setModificadores] = useState({ pv: "", san: "", pe: "" });
  const deslocamento = Math.floor((Number(agi) + Number(vig)) / 20) + 7;

  const values = {
    pv: { atual: pvAtual, max: pvMax, set: setPvAtual },
    san: { atual: sanAtual, max: sanMax, set: setSanAtual },
    pe: { atual: peAtual, max: peMax, set: setPeAtual },
  };

  const aplicar = (key, delta) => {
    const status = values[key];
    const maximo = Math.max(Number(status.max) || 0, 0);
    const novoValor = Math.max(0, Math.min(Number(status.atual) + Number(delta), maximo || Infinity));
    status.set(novoValor);
  };

  const aplicarModificador = (key) => {
    const valor = Number(modificadores[key]);
    if (!Number.isFinite(valor) || valor === 0) return;
    aplicar(key, valor);
    setModificadores((current) => ({ ...current, [key]: "" }));
  };

  return (
    <section className="agent-resource-strip" aria-label="Recursos do agente">
      <div className="agent-resource-strip__label">
        <span>RECURSOS</span>
        <strong>Condição do agente</strong>
      </div>

      <div className="agent-resource-strip__items">
        {STATUS.map((item) => {
          const Icon = item.icon;
          const data = values[item.key];
          const max = Math.max(Number(data.max) || 0, 1);
          const atual = Math.max(Number(data.atual) || 0, 0);
          const percent = Math.max(0, Math.min((atual / max) * 100, 100));
          const critical = item.key === "pv" && percent <= 25;

          return (
            <article
              key={item.key}
              className={`agent-resource ${critical ? "is-critical" : ""}`}
              style={{ "--resource-color": item.color, "--resource-percent": `${percent}%` }}
            >
              <div className="agent-resource__identity">
                <span><Icon size={15} /></span>
                <div>
                  <strong>{item.short}</strong>
                  <small>{item.label}</small>
                </div>
              </div>

              <div className="agent-resource__value">
                <strong>{atual}</strong>
                <span>/ {data.max}</span>
              </div>

              <div className="agent-resource__track"><i /></div>

              <div className="agent-resource__controls">
                <button type="button" onClick={() => aplicar(item.key, -1)} aria-label={`Diminuir ${item.label}`}>
                  <Minus size={13} />
                </button>
                <input
                  type="number"
                  value={modificadores[item.key]}
                  onChange={(event) =>
                    setModificadores((current) => ({ ...current, [item.key]: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") aplicarModificador(item.key);
                  }}
                  placeholder="±"
                  aria-label={`Alterar ${item.label}`}
                />
                <button type="button" className="agent-resource__apply" onClick={() => aplicarModificador(item.key)}>
                  OK
                </button>
                <button type="button" onClick={() => aplicar(item.key, 1)} aria-label={`Aumentar ${item.label}`}>
                  <Plus size={13} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="agent-resource-strip__movement" title="Deslocamento">
        <Footprints size={16} />
        <strong>{deslocamento}m</strong>
        <span>desloc.</span>
      </div>
    </section>
  );
}
