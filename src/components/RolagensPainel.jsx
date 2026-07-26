import React from "react";
import { Clock3, Dices, Sparkles, Swords } from "lucide-react";

const resultadoClasses = {
  Desastre: "roll-result--desastre",
  Fracasso: "roll-result--fracasso",
  Sucesso: "roll-result--sucesso",
  "Sucesso Bom": "roll-result--bom",
  "Sucesso Extremo": "roll-result--extremo",
  "Sucesso Perfeito": "roll-result--perfeito",
  Dano: "roll-result--dano",
};

function formatarHorario(valor) {
  if (!valor) return "—";

  try {
    const data = new Date(valor);
    if (!Number.isNaN(data.getTime())) {
      return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  } catch {
    // O horário salvo como HH:mm:ss já será exibido sem conversão.
  }

  return String(valor);
}

export default function RolagensPainel({ rolagens = [] }) {
  const recentes = rolagens.slice().reverse().slice(0, 30);

  return (
    <section className="master-rolls">
      <header className="master-rolls__header">
        <div>
          <span className="master-rolls__icon"><Dices size={20} /></span>
          <div>
            <p>HISTÓRICO</p>
            <h2>Rolagens e danos</h2>
          </div>
        </div>
        <span className="master-rolls__count">{recentes.length}</span>
      </header>

      <div className="master-rolls__list">
        {recentes.length ? (
          recentes.map((rolagem, index) => {
            const resultado = rolagem["Tipo de Sucesso"] || "—";
            const tipo = rolagem.Tipo || "Rolagem";
            const ehDano = resultado === "Dano" || tipo.toLowerCase().includes("dano");
            const ehRitual = tipo.toLowerCase().includes("ritual");
            const Icon = ehDano ? (ehRitual ? Sparkles : Swords) : Dices;
            const classeResultado = resultadoClasses[resultado] || "roll-result--neutro";
            const horario = rolagem.Horário || rolagem.Horario;
            const formula = rolagem["Fórmula"] || rolagem.Formula || "";

            return (
              <article
                className={`master-roll${index === 0 ? " master-roll--latest" : ""}${ehDano ? " master-roll--damage" : ""}`}
                key={rolagem.ID || `${horario || "rolagem"}-${index}`}
              >
                <div className="master-roll__value" aria-label={`Resultado ${rolagem.Valor || 0}`}>
                  <Icon size={14} />
                  <strong>{rolagem.Valor ?? "—"}</strong>
                </div>

                <div className="master-roll__content">
                  <div className="master-roll__topline">
                    <strong>{rolagem["Nome do Personagem"] || "Personagem"}</strong>
                    <span><Clock3 size={11} /> {formatarHorario(horario)}</span>
                  </div>

                  <div className="master-roll__description">
                    <span>{tipo}</span>
                    <b>•</b>
                    <strong>{rolagem.Nome || "Sem nome"}</strong>
                    {formula && <em>{formula}</em>}
                  </div>

                  <span className={`master-roll__result ${classeResultado}`}>
                    {ehDano ? `${rolagem.Valor ?? 0} de dano` : resultado}
                  </span>
                </div>
              </article>
            );
          })
        ) : (
          <div className="master-rolls__empty">
            <Dices size={30} />
            <strong>Nenhuma rolagem ainda</strong>
            <span>Testes, ataques e rituais aparecerão aqui.</span>
          </div>
        )}
      </div>
    </section>
  );
}
