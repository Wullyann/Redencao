import React, { useState } from "react";
import { Brain, Footprints, Heart, Minus, Plus, Shield, Zap } from "lucide-react";

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
  rd,
  rdObservacao,
  onRdChange,
  onRdObservacaoChange,
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
    const atual = Number(status.atual) || 0;
    const maximo = Math.max(Number(status.max) || 0, 0);
    const limite = maximo > 0 ? maximo : Infinity;
    status.set(Math.max(0, Math.min(atual + Number(delta), limite)));
  };

  const aplicarModificador = (key) => {
    const valor = Number(modificadores[key]);
    if (!Number.isFinite(valor) || valor === 0) return;
    aplicar(key, valor);
    setModificadores((current) => ({ ...current, [key]: "" }));
  };

  return (
    <div className="vital-dashboard">
      <div className="vital-dashboard-heading">
        <div>
          <span>CONDIÇÃO ATUAL</span>
          <strong>Recursos do agente</strong>
        </div>

        <div className="vital-heading-tools">
          <div className="vital-movement" title="Deslocamento do personagem">
            <Footprints size={17} />
            <div>
              <strong>{deslocamento}m</strong>
              <span>deslocamento</span>
            </div>
          </div>

          <div className="vital-rd" title="Resistência a dano. O valor é informativo e não reduz dano automaticamente.">
            <Shield size={17} />
            <label>
              <span>RD geral</span>
              <input
                type="number"
                min="0"
                value={rd ?? 0}
                onChange={(event) => onRdChange?.(event.target.value)}
                aria-label="RD geral"
              />
            </label>
            <input
              className="vital-rd-note"
              type="text"
              value={rdObservacao || ""}
              onChange={(event) => onRdObservacaoChange?.(event.target.value)}
              placeholder="Observação da RD"
              aria-label="Observação da RD"
            />
          </div>
        </div>
      </div>

      <div className="vital-cards">
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
              className={`vital-card ${critical ? "is-critical" : ""}`}
              style={{ "--vital-color": item.color, "--vital-percent": `${percent}%` }}
            >
              <div className="vital-card-top">
                <span className="vital-icon"><Icon size={18} /></span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.short}</small>
                </div>
                <b>{atual}<em>/ {data.max}</em></b>
              </div>

              <div className="vital-progress"><span /></div>

              <div className="vital-actions">
                <button
                  type="button"
                  onClick={() => aplicar(item.key, -1)}
                  aria-label={`Diminuir ${item.label}`}
                >
                  <Minus size={16} />
                </button>

                <div className="vital-quick-input">
                  <input
                    type="number"
                    value={modificadores[item.key]}
                    onChange={(event) =>
                      setModificadores((current) => ({
                        ...current,
                        [item.key]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") aplicarModificador(item.key);
                    }}
                    placeholder="± valor"
                    aria-label={`Alterar ${item.label}`}
                  />
                  <button type="button" onClick={() => aplicarModificador(item.key)}>
                    Aplicar
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => aplicar(item.key, 1)}
                  aria-label={`Aumentar ${item.label}`}
                >
                  <Plus size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
