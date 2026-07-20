import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  Eye,
  Heart,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import RolagensPainel from "../components/RolagensPainel";
import ModalFichaDetalhada from "../components/ModalFichaDetalhada";
import "./EscudoDoMestre.css";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

function limitarPorcentagem(atual, maximo) {
  const atualNumero = Number(atual) || 0;
  const maximoNumero = Number(maximo) || 0;
  if (maximoNumero <= 0) return 0;
  return Math.max(0, Math.min((atualNumero / maximoNumero) * 100, 100));
}

function obterIniciais(nome) {
  const palavras = String(nome || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!palavras.length) return "?";
  return palavras
    .slice(0, 2)
    .map((palavra) => palavra[0]?.toUpperCase())
    .join("");
}

function BarraStatus({ tipo, label, atual, maximo, icon: Icon }) {
  const porcentagem = limitarPorcentagem(atual, maximo);
  const atualNumero = Number(atual) || 0;
  const maximoNumero = Number(maximo) || 0;

  return (
    <div className="master-stat">
      <div className="master-stat__header">
        <span className={`master-stat__label master-stat__label--${tipo}`}>
          <Icon size={14} strokeWidth={2.4} />
          {label}
        </span>
        <strong>
          {atualNumero}<span>/</span>{maximoNumero}
        </strong>
      </div>
      <div className="master-stat__track" aria-label={`${label}: ${atualNumero} de ${maximoNumero}`}>
        <div
          className={`master-stat__fill master-stat__fill--${tipo}`}
          style={{ width: `${porcentagem}%` }}
        />
      </div>
    </div>
  );
}

function CardAgente({ ficha, onOpen }) {
  const nome = ficha["Nome do Personagem"] || "Sem nome";
  const imagem = ficha["Imagem do Personagem"] || "";
  const pvAtual = Number(ficha["PV Atual"]) || 0;
  const pvMax = Number(ficha["PV Máx."]) || 0;
  const peAtual = Number(ficha["PE Atual"]) || 0;
  const peMax = Number(ficha["PE Máx."]) || 0;
  const sanAtual = Number(ficha["Sanidade Atual"]) || 0;
  const sanMax = Number(ficha["Sanidade Máx."]) || 0;
  const vidaPercentual = limitarPorcentagem(pvAtual, pvMax);
  const emRisco = pvMax > 0 && vidaPercentual <= 25;

  const atributos = [
    ["AGI", ficha.AGI],
    ["FOR", ficha.FOR],
    ["INT", ficha.INT],
    ["PRE", ficha.PRE],
    ["VIG", ficha.VIG],
  ];

  return (
    <article className={`master-agent-card${emRisco ? " master-agent-card--danger" : ""}`}>
      <div className="master-agent-card__top">
        <div className="master-agent-card__avatar" aria-hidden="true">
          {imagem ? (
            <img
              src={imagem}
              alt=""
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.nextElementSibling.style.display = "grid";
              }}
            />
          ) : null}
          <span style={{ display: imagem ? "none" : "grid" }}>{obterIniciais(nome)}</span>
        </div>

        <div className="master-agent-card__identity">
          <div className="master-agent-card__name-row">
            <h3>{nome}</h3>
            <span className="master-agent-card__nex">NEX {ficha.NEX || 0}%</span>
          </div>
          <p>{ficha.Classe || "Classe desconhecida"}</p>
          {ficha.Origem ? <small>{ficha.Origem}</small> : null}
        </div>
      </div>

      <div className="master-agent-card__attributes" aria-label="Atributos">
        {atributos.map(([sigla, valor]) => (
          <div key={sigla} className="master-attribute">
            <span>{sigla}</span>
            <strong>{valor || 0}</strong>
          </div>
        ))}
      </div>

      <div className="master-agent-card__stats">
        <BarraStatus tipo="vida" label="Vida" atual={pvAtual} maximo={pvMax} icon={Heart} />
        <BarraStatus tipo="sanidade" label="Sanidade" atual={sanAtual} maximo={sanMax} icon={Brain} />
        <BarraStatus tipo="pe" label="PE" atual={peAtual} maximo={peMax} icon={Sparkles} />
      </div>

      <button className="master-agent-card__button" onClick={() => onOpen(ficha)}>
        <Eye size={17} />
        Abrir ficha
      </button>
    </article>
  );
}

export default function EscudoDoMestre() {
  const [fichas, setFichas] = useState([]);
  const [rolagens, setRolagens] = useState([]);
  const [fichaSelecionada, setFichaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  useEffect(() => {
    let ativo = true;

    const carregarDados = async (mostrarIndicador = false) => {
      if (mostrarIndicador && ativo) setAtualizando(true);

      try {
        const [respostaFichas, respostaRolagens] = await Promise.all([
          fetch(`${BASE_URL}?sheet=Fichas`),
          fetch(`${BASE_URL}?sheet=Rolagens`),
        ]);

        if (!respostaFichas.ok || !respostaRolagens.ok) {
          throw new Error("Não foi possível carregar os dados.");
        }

        const [dadosFichas, dadosRolagens] = await Promise.all([
          respostaFichas.json(),
          respostaRolagens.json(),
        ]);

        if (!ativo) return;
        setFichas(Array.isArray(dadosFichas) ? dadosFichas : []);
        setRolagens(Array.isArray(dadosRolagens) ? dadosRolagens : []);
        setUltimaAtualizacao(new Date());
        setErro("");
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        if (ativo) setErro("Não foi possível atualizar o painel agora.");
      } finally {
        if (ativo) {
          setLoading(false);
          setAtualizando(false);
        }
      }
    };

    carregarDados();
    const interval = setInterval(() => carregarDados(false), 3000);

    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, []);

  const fichasOrdenadas = useMemo(
    () =>
      fichas
        .slice()
        .sort((a, b) =>
          String(a["Nome do Personagem"] || "").localeCompare(
            String(b["Nome do Personagem"] || ""),
            "pt-BR"
          )
        ),
    [fichas]
  );

  if (loading) {
    return (
      <div className="master-loading">
        <Shield size={34} />
        <span>Preparando o Escudo do Mestre...</span>
      </div>
    );
  }

  return (
    <div className="master-page">
      <div className="master-container">
        <header className="master-header">
          <div className="master-header__title">
            <span className="master-header__icon"><Shield size={28} /></span>
            <div>
              <p>PAINEL DA SESSÃO</p>
              <h1>Escudo do Mestre</h1>
            </div>
          </div>

          <div className="master-header__status">
            <span className="master-live"><i /> Ao vivo</span>
            <span className="master-header__agents"><Users size={16} /> {fichas.length} agentes</span>
            <span className={`master-refresh${atualizando ? " master-refresh--active" : ""}`}>
              <RefreshCw size={15} />
              {ultimaAtualizacao
                ? ultimaAtualizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                : "—"}
            </span>
          </div>
        </header>

        {erro ? <div className="master-error">{erro}</div> : null}

        <div className="master-layout">
          <main className="master-agents-panel">
            <div className="master-section-title">
              <div>
                <Activity size={19} />
                <h2>Agentes em campo</h2>
              </div>
              <span>{fichas.length} fichas conectadas</span>
            </div>

            {fichasOrdenadas.length ? (
              <div className="master-agents-grid">
                {fichasOrdenadas.map((ficha, index) => (
                  <CardAgente
                    key={ficha.ID || `${ficha["Nome do Personagem"]}-${index}`}
                    ficha={ficha}
                    onOpen={setFichaSelecionada}
                  />
                ))}
              </div>
            ) : (
              <div className="master-empty">
                <Users size={34} />
                <h3>Nenhum agente encontrado</h3>
                <p>As fichas aparecerão aqui assim que forem cadastradas.</p>
              </div>
            )}
          </main>

          <aside className="master-rolls-column">
            <RolagensPainel rolagens={rolagens} />
          </aside>
        </div>
      </div>

      {fichaSelecionada && (
        <ModalFichaDetalhada
          ficha={fichaSelecionada}
          onClose={() => setFichaSelecionada(null)}
        />
      )}
    </div>
  );
}
