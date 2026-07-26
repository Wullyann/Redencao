import React, { useEffect, useMemo, useState } from "react";
import { Clock3, Dices, Sparkles, Swords } from "lucide-react";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

const RESULTADO_CLASSES = {
  Desastre: "is-disaster",
  Fracasso: "is-failure",
  Sucesso: "is-success",
  "Sucesso Bom": "is-good",
  "Sucesso Extremo": "is-extreme",
  "Sucesso Perfeito": "is-perfect",
  Dano: "is-damage",
};

function normalizar(rolagem, origem = "remoto") {
  return {
    id: rolagem.ID || rolagem.localId || `${origem}-${Math.random().toString(36).slice(2)}`,
    horario: rolagem.Horario || rolagem["Horário"] || rolagem.horario || "",
    personagem:
      rolagem["Nome do Personagem"] || rolagem.personagem || "Personagem",
    tipo: rolagem.Tipo || rolagem.tipo || "Rolagem",
    nome:
      rolagem.Nome || rolagem.nome || rolagem.pericia || "Sem nome",
    valor: rolagem.Valor ?? rolagem.valor ?? "—",
    resultado:
      rolagem["Tipo de Sucesso"] || rolagem.tipoSucesso || "",
    formula: rolagem["Fórmula"] || rolagem.Formula || rolagem.formula || "",
    origem,
  };
}

function assinatura(rolagem) {
  return [
    rolagem.horario,
    rolagem.personagem,
    rolagem.tipo,
    rolagem.nome,
    rolagem.valor,
    rolagem.resultado,
  ].join("|");
}

export default function RolagensSection({ fichaId, rolagensLocais = [] }) {
  const [rolagensRemotas, setRolagensRemotas] = useState([]);

  useEffect(() => {
    if (!fichaId) return undefined;
    let ativo = true;

    const carregarRolagens = () => {
      fetch(`${BASE_URL}?sheet=Rolagens&_=${Date.now()}`, { cache: "no-store" })
        .then((resposta) => resposta.json())
        .then((dados) => {
          if (!ativo) return;
          const filtradas = (Array.isArray(dados) ? dados : [])
            .filter((rolagem) => String(rolagem["ID da Ficha"]) === String(fichaId))
            .sort((a, b) =>
              String(b.Horario || b["Horário"] || "").localeCompare(
                String(a.Horario || a["Horário"] || "")
              )
            );
          setRolagensRemotas(filtradas);
        })
        .catch((erro) => console.error("Erro ao carregar rolagens:", erro));
    };

    carregarRolagens();
    const intervalo = window.setInterval(carregarRolagens, 4000);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [fichaId]);

  const rolagens = useMemo(() => {
    const locais = rolagensLocais.map((rolagem) => normalizar(rolagem, "local"));
    const remotas = rolagensRemotas.map((rolagem) => normalizar(rolagem, "remoto"));
    const vistas = new Set();

    return [...locais, ...remotas].filter((rolagem) => {
      const chave = assinatura(rolagem);
      if (vistas.has(chave)) return false;
      vistas.add(chave);
      return true;
    });
  }, [rolagensLocais, rolagensRemotas]);

  return (
    <section className="roll-history">
      <header className="roll-history__header">
        <div>
          <span><Dices size={18} /></span>
          <div>
            <small>REGISTRO DA SESSÃO</small>
            <strong>Histórico de rolagens e danos</strong>
          </div>
        </div>
        <b>{rolagens.length}</b>
      </header>

      <div className="roll-history__list">
        {rolagens.length ? (
          rolagens.map((rolagem, index) => {
            const ehDano =
              rolagem.resultado === "Dano" ||
              rolagem.tipo.toLowerCase().includes("dano");
            const ehRitual = rolagem.tipo.toLowerCase().includes("ritual");
            const Icon = ehDano ? (ehRitual ? Sparkles : Swords) : Dices;
            const classeResultado =
              RESULTADO_CLASSES[rolagem.resultado] || "is-neutral";

            return (
              <article
                className={`roll-history__item ${ehDano ? "is-damage-event" : ""}`}
                key={`${rolagem.id}-${index}`}
              >
                <div className="roll-history__value">
                  <Icon size={15} />
                  <strong>{rolagem.valor}</strong>
                </div>

                <div className="roll-history__content">
                  <div className="roll-history__topline">
                    <strong>{rolagem.nome}</strong>
                    <span><Clock3 size={11} /> {rolagem.horario || "—"}</span>
                  </div>

                  <p>
                    <span>{rolagem.tipo}</span>
                    {rolagem.formula && <em>{rolagem.formula}</em>}
                  </p>

                  <div className="roll-history__footer">
                    <span className={`roll-history__result ${classeResultado}`}>
                      {ehDano ? `${rolagem.valor} de dano` : rolagem.resultado || "Resultado"}
                    </span>
                    <small>{rolagem.personagem}</small>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="roll-history__empty">
            <Dices size={30} />
            <strong>Nenhuma rolagem registrada</strong>
            <span>Ataques, rituais, perícias e atributos aparecerão aqui.</span>
          </div>
        )}
      </div>
    </section>
  );
}
