// src/components/RituaisSection.jsx
import React, { useState, useEffect } from 'react';
import { FaDiceD20, FaChevronDown, FaChevronUp, FaEdit, FaTrash } from 'react-icons/fa';

const ELEMENTOS = ['Sangue', 'Energia', 'Conhecimento', 'Morte', 'Medo'];
const EXECUCOES = ['Livre', 'Padrão', 'Movimento', 'Completa'];
const ALCANCES = ['Toque', 'Curto (9m)', 'Médio (18m)', 'Longo (36m)', 'Extremo (90m)'];
const DURACOES = ['Instantânea', 'Cena', 'Um dia'];
const BASE_URL = 'https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec';

const cores = {
  Sangue: '#8B0000',
  Energia: '#9932CC',
  Conhecimento: '#DAA520',
  Morte: '#2F4F4F',
  Medo: '#191970'
};

export default function RituaisSection({ nivel, intelecto, fichaId }) {
  // State hooks
  const [rituais, setRituais] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [popup, setPopup] = useState({ idx: null, type: '', rolls: [], total: 0 });
  const [pe, setPe] = useState('0');
  const [circulo, setCirculo] = useState(1);
  const [busca, setBusca] = useState('');
  const [modoCriacao, setModoCriacao] = useState(false);

  // Modelo inicial para um ritual novo ou em edição
  const ritualNovo = {
    "ID da Ficha": fichaId,
    "Nome do Ritual": "",
    "Dano": "",
    "Elemento": "Sangue",
    "Execução": "Livre",
    "Alcance": "Toque",
    "Alvo": "",
    "Duração": "Instantânea",
    "PE": "0",
    "Círculo": "1",
    "Descrição": "",
    "Discente Ativo": "false",
    "Discente Dano": "",
    "Discente Custo": "",
    "Discente Pré-requisito": "",
    "Discente Descrição": "",
    "Verdadeira Ativo": "false",
    "Verdadeira Dano": "",
    "Verdadeira Custo": "",
    "Verdadeira Pré-requisito": "",
    "Verdadeira Descrição": ""
  };
  const [novo, setNovo] = useState({ ...ritualNovo });

  // Cálculo de DT
  const dt = !isNaN(parseFloat(pe)) && !isNaN(parseInt(circulo)) && nivel && intelecto
    ? ((parseFloat(pe) + 2 * parseInt(circulo)) / (2 + nivel / 2 + intelecto / 7)).toFixed(2)
    : '--';

  // Fetch inicial de rituais da planilha
  useEffect(() => {
    if (!fichaId) return;
    fetch(`${BASE_URL}?sheet=Rituais`)
      .then(res => res.json())
      .then(data => {
        const meus = data.filter(r => String(r["ID da Ficha"]) === String(fichaId));
        setRituais(meus);
      })
      .catch(console.error);
  }, [fichaId]);

  // Função para rolar dados
  function rollDado(formula, idx, type) {
    try {
      const [dados, bonus = ''] = formula.split('+');
      const [q, fv] = dados.includes('d') ? dados.split('d') : ['1', dados];
      const qty = parseInt(q) || 1;
      const fac = parseInt(fv) || 6;
      const b = parseInt(bonus) || 0;
      const rolls = Array.from({ length: qty }, () => Math.floor(Math.random() * fac) + 1);
      const total = rolls.reduce((a, b) => a + b, 0) + b;
      setPopup({ idx, type, rolls, total });
    } catch {
      setPopup({ idx: null, type: '', rolls: [], total: 0 });
    }
  }

  // Calcula DT individual de ritual
  function calcularDT(peVal, circuloVal) {
    const numerador = parseFloat(peVal) + parseInt(circuloVal);
    const denominador = 2 + nivel / 2 + intelecto / 7;
    return (numerador / denominador).toFixed(2);
  }

  // Estilos de cores para resultado de DT
  const dtStyles = {
    Sucesso: { color: 'lime', textShadow: '0 0 12px lime' },
    Bom: { color: 'cyan', textShadow: '0 0 12px cyan' },
    Extremo: { color: 'white', textShadow: '0 0 10px white' },
    Perfeito: { color: '#FFD700', textShadow: '0 0 12px #FFD700' }
  };

  // Interpreta valor numérico de DT em texto
  function getDescricaoDT(dtVal) {
    const val = parseFloat(dtVal);
    if (val < 1) return 'Sucesso';
    if (val < 2) return 'Bom';
    if (val < 3) return 'Extremo';
    return 'Perfeito';
  }

  // Excluir ritual
  function excluirRitual(r) {
    if (!window.confirm("Tem certeza que deseja excluir este ritual?")) return;
    fetch(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({ acao: 'deletarRitual', "ID da Ficha": fichaId, "Nome do Ritual": r["Nome do Ritual"] })
    }).then(() => {
      setRituais(prev => prev.filter(x => x !== r));
      setExpanded(null);
    });
  }

  // Estilo base para inputs
  const baseInput = {
    width: '100%',
    padding: 6,
    marginBottom: 8,
    background: '#111',
    color: '#D4AF37',
    border: '1px solid #D4AF37',
    borderRadius: 4
  };

  // Estilo para labels explicativos
  const labelStyle = {
    color: '#D4AF37',
    fontWeight: 'bold',
    marginTop: 8
  };

  // Filtra pela busca
  const list = rituais.filter(r => r["Nome do Ritual"].toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={{ maxWidth: 500 }}>
      {/* === DT do Ritual === */}
      <div
        style={{
          border: '2px solid #D4AF37',
          borderRadius: 8,
          padding: 12,
          background: '#000',
          marginBottom: 16
        }}
      >
        <h3 style={{ color: '#D4AF37', margin: 0 }}>DT do Ritual</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <label style={{ color: 'white' }}>
            PE:
            <input
              type="number"
              value={pe}
              onChange={e => setPe(e.target.value)}
              style={{ ...baseInput, width: 60, marginLeft: 6 }}
            />
          </label>
          <label style={{ color: 'white' }}>
            Círculo:
            <select
              value={circulo}
              onChange={e => setCirculo(e.target.value)}
              style={{ ...baseInput, width: 100, marginLeft: 6 }}
            >
              {[1, 2, 3, 4].map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <span style={dtStyles[getDescricaoDT(dt)]}>
            Resultado: <strong>{getDescricaoDT(dt)}</strong>
          </span>
        </div>
      </div>

      {/* === Cabeçalho + Botão "Novo Ritual" === */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => {
            setModoCriacao(true);
            setNovo({ ...ritualNovo });
          }}
          style={{
            background: '#D4AF37',
            color: '#000',
            padding: '8px 12px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          + Novo Ritual
        </button>
        <input
          placeholder="Buscar rituais"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, ...baseInput }}
        />
      </div>

      {/* === Formulário de Criação / Edição === */}
      {modoCriacao && (
        <div
          style={{
            background: '#222',
            border: '2px solid #D4AF37',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20
          }}
        >
          <h3 style={{ color: '#D4AF37', margin: 0 }}>
            {novo["Nome do Ritual"] ? 'Editar Ritual' : 'Novo Ritual'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Nome do Ritual */}
            <label style={labelStyle}>Nome do Ritual</label>
            <input
              placeholder="Nome do Ritual"
              value={novo["Nome do Ritual"]}
              onChange={e => setNovo({ ...novo, "Nome do Ritual": e.target.value })}
              style={baseInput}
            />

            {/* Dano */}
            <label style={labelStyle}>Dano (ex: 2d8+2)</label>
            <input
              placeholder="Dano"
              value={novo.Dano}
              onChange={e => setNovo({ ...novo, Dano: e.target.value })}
              style={baseInput}
            />

            {/* Elemento */}
            <label style={labelStyle}>Elemento do Ritual</label>
            <select
              value={novo.Elemento}
              onChange={e => setNovo({ ...novo, Elemento: e.target.value })}
              style={baseInput}
            >
              {ELEMENTOS.map(el => (
                <option key={el} value={el}>
                  {el}
                </option>
              ))}
            </select>

            {/* Círculo */}
            <label style={labelStyle}>Círculo (1 a 4)</label>
            <select
              value={novo.Círculo}
              onChange={e => setNovo({ ...novo, Círculo: e.target.value })}
              style={baseInput}
            >
              {[1, 2, 3, 4].map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Execução */}
            <label style={labelStyle}>Execução</label>
            <select
              value={novo.Execução}
              onChange={e => setNovo({ ...novo, Execução: e.target.value })}
              style={baseInput}
            >
              {EXECUCOES.map(op => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            {/* Alcance */}
            <label style={labelStyle}>Alcance</label>
            <select
              value={novo.Alcance}
              onChange={e => setNovo({ ...novo, Alcance: e.target.value })}
              style={baseInput}
            >
              {ALCANCES.map(op => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            {/* Alvo */}
            <label style={labelStyle}>Alvo (descrição livre)</label>
            <input
              placeholder="Alvo do Ritual"
              value={novo.Alvo}
              onChange={e => setNovo({ ...novo, Alvo: e.target.value })}
              style={baseInput}
            />

            {/* Duração */}
            <label style={labelStyle}>Duração</label>
            <select
              value={novo.Duração}
              onChange={e => setNovo({ ...novo, Duração: e.target.value })}
              style={baseInput}
            >
              {DURACOES.map(op => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            {/* Custo em PE */}
            <label style={labelStyle}>Custo em PE</label>
            <input
              placeholder="Custo em PE"
              value={novo.PE}
              onChange={e => setNovo({ ...novo, PE: e.target.value })}
              style={baseInput}
            />

            {/* Descrição Geral */}
            <label style={labelStyle}>Descrição do Ritual</label>
            <textarea
              placeholder="Descrição do Ritual"
              value={novo.Descrição}
              onChange={e => setNovo({ ...novo, Descrição: e.target.value })}
              rows={4}
              style={{ ...baseInput, resize: 'vertical' }}
            />

            {/* === Versão Discente === */}
            <label style={labelStyle}>
              <input
                type="checkbox"
                checked={novo["Discente Ativo"] === "true"}
                onChange={e =>
                  setNovo({
                    ...novo,
                    "Discente Ativo": e.target.checked ? "true" : "false"
                  })
                }
                style={{ marginRight: 8 }}
              />
              Ativar versão Discente
            </label>
            {novo["Discente Ativo"] === "true" && (
              <>
                <label style={labelStyle}>Dano Discente (ex: 3d8+2)</label>
                <input
                  placeholder="Dano Discente"
                  value={novo["Discente Dano"]}
                  onChange={e => setNovo({ ...novo, "Discente Dano": e.target.value })}
                  style={baseInput}
                />
                <label style={labelStyle}>Custo em PE adicional</label>
                <input
                  placeholder="Custo Discente"
                  value={novo["Discente Custo"]}
                  onChange={e => setNovo({ ...novo, "Discente Custo": e.target.value })}
                  style={baseInput}
                />
                <label style={labelStyle}>Pré-requisito Discente</label>
                <input
                  placeholder="Pré-requisito Discente"
                  value={novo["Discente Pré-requisito"]}
                  onChange={e =>
                    setNovo({ ...novo, "Discente Pré-requisito": e.target.value })
                  }
                  style={baseInput}
                />
                <label style={labelStyle}>Descrição Discente</label>
                <textarea
                  placeholder="Descrição Discente"
                  value={novo["Discente Descrição"]}
                  onChange={e =>
                    setNovo({ ...novo, "Discente Descrição": e.target.value })
                  }
                  rows={3}
                  style={{ ...baseInput, resize: 'vertical' }}
                />
              </>
            )}

            {/* === Versão Verdadeira === */}
            <label style={labelStyle}>
              <input
                type="checkbox"
                checked={novo["Verdadeira Ativo"] === "true"}
                onChange={e =>
                  setNovo({
                    ...novo,
                    "Verdadeira Ativo": e.target.checked ? "true" : "false"
                  })
                }
                style={{ marginRight: 8 }}
              />
              Ativar versão Verdadeira
            </label>
            {novo["Verdadeira Ativo"] === "true" && (
              <>
                <label style={labelStyle}>Dano Verdadeiro (ex: 2d8+9)</label>
                <input
                  placeholder="Dano Verdadeiro"
                  value={novo["Verdadeira Dano"]}
                  onChange={e => setNovo({ ...novo, "Verdadeira Dano": e.target.value })}
                  style={baseInput}
                />
                <label style={labelStyle}>Custo em PE adicional</label>
                <input
                  placeholder="Custo Verdadeiro"
                  value={novo["Verdadeira Custo"]}
                  onChange={e => setNovo({ ...novo, "Verdadeira Custo": e.target.value })}
                  style={baseInput}
                />
                <label style={labelStyle}>Pré-requisito Verdadeiro</label>
                <input
                  placeholder="Pré-requisito Verdadeiro"
                  value={novo["Verdadeira Pré-requisito"]}
                  onChange={e =>
                    setNovo({ ...novo, "Verdadeira Pré-requisito": e.target.value })
                  }
                  style={baseInput}
                />
                <label style={labelStyle}>Descrição Verdadeira</label>
                <textarea
                  placeholder="Descrição Verdadeira"
                  value={novo["Verdadeira Descrição"]}
                  onChange={e =>
                    setNovo({ ...novo, "Verdadeira Descrição": e.target.value })
                  }
                  rows={3}
                  style={{ ...baseInput, resize: 'vertical' }}
                />
              </>
            )}

            {/* Botões Salvar / Cancelar */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                onClick={async () => {
                  const formData = new FormData();
                  formData.append('acao', 'salvarRitual');
                  Object.entries(novo).forEach(([chave, valor]) => {
                    formData.append(chave, valor);
                  });
                  try {
                    const res = await fetch(BASE_URL, {
                      method: 'POST',
                      body: formData
                    });
                    const data = await res.json();
                    if (data.status === 'sucesso') {
                      alert('Ritual salvo com sucesso!');
                      setModoCriacao(false);
                      setNovo({ ...ritualNovo });
                      // Recarrega rituais
                      const req = await fetch(`${BASE_URL}?sheet=Rituais`);
                      const json = await req.json();
                      const meus = json.filter(
                        r => String(r['ID da Ficha']) === String(fichaId)
                      );
                      setRituais(meus);
                    } else {
                      alert('Erro ao salvar: ' + data.mensagem);
                    }
                  } catch (err) {
                    alert('Erro ao salvar ritual: ' + err.message);
                  }
                }}
                style={{
                  background: '#D4AF37',
                  color: '#000',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Salvar Ritual
              </button>
              <button
                onClick={() => {
                  setModoCriacao(false);
                  setNovo({ ...ritualNovo });
                }}
                style={{
                  background: '#800',
                  color: '#fff',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Lista de Rituais === */}
      {list.map((r, i) => {
        const discenteAtivo = String(r['Discente Ativo']).toLowerCase() === 'true';
        const verdadeiraAtivo = String(r['Verdadeira Ativo']).toLowerCase() === 'true';

        return (
          <div
            key={i}
            style={{
              border: `2px solid ${cores[r.Elemento] || '#D4AF37'}`,
              borderRadius: 8,
              background: `${cores[r.Elemento]}22`,
              padding: 12,
              marginBottom: 16,
              color: '#fff'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ color: '#fff' }}>
                    {r.Elemento} {r['Círculo']}
                  </strong>
                  <span style={{ marginLeft: 8 }}>{r['Nome do Ritual']}</span>
                </div>
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  {expanded === i ? (
                    <FaChevronUp color="#fff" />
                  ) : (
                    <FaChevronDown color="#fff" />
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  marginTop: 8,
                  textAlign: 'center'
                }}
              >
                {r.Dano?.trim() && (
                  <div style={{ color: '#fff' }}>
                    <div>NORMAL</div>
                    <div>
                      {r.Dano}
                      <FaDiceD20
                        onClick={() => rollDado(r.Dano, i, 'Normal')}
                        style={{ cursor: 'pointer', marginLeft: 4 }}
                      />
                    </div>
                  </div>
                )}

                {discenteAtivo && (
                  <div style={{ color: '#DAA520' }}>
                    <div>DISCENTE</div>
                    <div>
                      {r['Discente Dano']}
                      <FaDiceD20
                        onClick={() => rollDado(r['Discente Dano'], i, 'Discente')}
                        style={{ cursor: 'pointer', marginLeft: 4 }}
                      />
                    </div>
                  </div>
                )}

                {verdadeiraAtivo && (
                  <div style={{ color: '#FFD700' }}>
                    <div>VERDADEIRO</div>
                    <div>
                      {r['Verdadeira Dano']}
                      <FaDiceD20
                        onClick={() => rollDado(r['Verdadeira Dano'], i, 'Verdadeira')}
                        style={{ cursor: 'pointer', marginLeft: 4 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {expanded === i && (
              <div style={{ marginTop: 12, color: '#fff', fontSize: 14 }}>
                <div>
                  <strong>PE:</strong> {r.PE}
                  {r.PE && r.Círculo && !isNaN(parseFloat(r.PE)) && (
                    <span
                      style={{
                        marginLeft: 8,
                        ...dtStyles[getDescricaoDT(calcularDT(r.PE, r.Círculo))]
                      }}
                    >
                      Resultado:{' '}
                      <strong>{getDescricaoDT(calcularDT(r.PE, r.Círculo))}</strong>
                    </span>
                  )}
                </div>

                <div>
                  <strong>Execução:</strong> {r.Execução}
                </div>
                <div>
                  <strong>Alcance:</strong> {r.Alcance}
                </div>
                <div>
                  <strong>Alvo:</strong> {r.Alvo}
                </div>
                <div>
                  <strong>Duração:</strong> {r.Duração}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Descrição:</strong> {r.Descrição}
                </div>
                <hr style={{ borderColor: '#333', margin: '8px 0' }} />

                {discenteAtivo && (
                  <div style={{ color: '#DAA520' }}>
                    <div>
                      <strong>PE:</strong> +{r['Discente Custo']}
                    </div>
                    <div>
                      <strong>Pré-requisito:</strong> {r['Discente Pré-requisito']}
                    </div>
                    <div>
                      <strong>Descrição:</strong> {r['Discente Descrição']}
                    </div>
                  </div>
                )}

                {verdadeiraAtivo && (
                  <>
                    <hr style={{ borderColor: '#444', margin: '8px 0' }} />
                    <div style={{ color: '#FFD700' }}>
                      <div>
                        <strong>PE:</strong> +{r['Verdadeira Custo']}
                      </div>
                      <div>
                        <strong>Pré-requisito:</strong> {r['Verdadeira Pré-requisito']}
                      </div>
                      <div>
                        <strong>Descrição:</strong> {r['Verdadeira Descrição']}
                      </div>
                    </div>
                  </>
                )}

                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => {
                      setNovo({ ...r });
                      setModoCriacao(true);
                    }}
                    style={{
                      background: '#444',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <FaEdit /> Editar
                  </button>
                  <button
                    onClick={() => excluirRitual(r)}
                    style={{
                      background: '#800',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <FaTrash /> Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* === Popup de resultado de rolagens === */}
      {popup.idx !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: '#000',
            border: `2px solid ${cores[rituais[popup.idx]?.Elemento]}`,
            borderRadius: 8,
            padding: 12,
            color: '#D4AF37',
            zIndex: 1000,
            maxWidth: 300
          }}
        >
          <button
            onClick={() => setPopup({ idx: null, type: '', rolls: [], total: 0 })}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#D4AF37',
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            ×
          </button>

          <div style={{ marginTop: 6, fontSize: 14 }}>
            <strong style={{ color: cores[rituais[popup.idx]?.Elemento] }}>
              {rituais[popup.idx]?.['Nome do Ritual']}
              {popup.type !== 'Normal' && ` - ${popup.type}`}
            </strong>
            <br />
            <span>Rolagens: {popup.rolls.join(', ')}</span>
            <br />
            <strong>Dano total: {popup.total}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
