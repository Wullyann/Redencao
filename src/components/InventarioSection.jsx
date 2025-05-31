import React, { useEffect, useState } from "react";
import { FaTrash, FaPlus, FaChevronDown, FaChevronUp, FaEdit } from "react-icons/fa";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";
const ELEMENTOS = ["Sangue", "Energia", "Conhecimento", "Morte", "Medo"];
const cores = {
  Sangue: "#8B0000",
  Energia: "#9932CC",
  Conhecimento: "#DAA520",
  Morte: "#2F4F4F",
  Medo: "#191970",
};

export default function InventarioSection({ fichaId }) {
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [modoCriacao, setModoCriacao] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(null);
  const [novo, setNovo] = useState({
    "ID da Ficha": fichaId,
    Item: "",
    Descrição: "",
    Quantidade: 1,
    Peso: "",
    Amaldiçoado: false,
    Elemento: "Sangue"
  });

  useEffect(() => {
    if (!fichaId) return;
    fetch(`${BASE_URL}?sheet=Inventario`)
      .then((res) => res.json())
      .then((data) => {
        const meus = data.filter(
          (i) => String(i["ID da Ficha"]) === String(fichaId)
        );
        setItens(meus);
      })
      .catch(console.error);
  }, [fichaId]);

  const salvarItem = async () => {
    const form = new FormData();
    Object.entries(novo).forEach(([k, v]) => form.append(k, v));
    form.append("acao", "salvarInventario");

    await fetch(BASE_URL, { method: "POST", body: form });
    setModoCriacao(false);
    setModoEdicao(null);
    setNovo({
      "ID da Ficha": fichaId,
      Item: "",
      Descrição: "",
      Quantidade: 1,
      Peso: "",
      Amaldiçoado: false,
      Elemento: "Sangue"
    });
    fetch(`${BASE_URL}?sheet=Inventario`)
      .then((res) => res.json())
      .then((data) => {
        const meus = data.filter(
          (i) => String(i["ID da Ficha"]) === String(fichaId)
        );
        setItens(meus);
      });
  };

  const deletarItem = async (item) => {
    const form = new FormData();
    form.append("acao", "deletarInventario");
    form.append("ID da Ficha", fichaId);
    form.append("Item", item["Item"]);

    await fetch(BASE_URL, { method: "POST", body: form });
    setItens((prev) => prev.filter((i) => i !== item));
  };

  const filtrado = itens.filter((i) =>
    i.Item.toLowerCase().includes(busca.toLowerCase())
  );

  const pesoTotal = filtrado.reduce((sum, i) => {
    const peso = parseFloat(i.Peso) || 0;
    const qtd = parseInt(i.Quantidade) || 1;
    return sum + peso * qtd;
  }, 0);

  return (
    <div style={{ border: "1px solid #D4AF37", borderRadius: 8, padding: 16, marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
  <h2 style={{ color: "#D4AF37", margin: 0 }}>Inventário</h2>
  <span style={{ color: "#B2955D", fontSize: 14, transform: "translateX(140px)" }}>
    Peso total: {pesoTotal.toFixed(2)} kg
  </span>
</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <input
          placeholder="Buscar item"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, padding: 6, background: "#111", border: "1px solid #D4AF37", color: "#fff", borderRadius: 4 }}
        />
        <button
          onClick={() => setModoCriacao(true)}
          style={{ background: "#D4AF37", color: "#000", padding: "6px 12px", borderRadius: 6 }}
        >
          <FaPlus /> Novo
        </button>
      </div>

      {filtrado.map((item, idx) => {
        const isAmald = item.Amaldiçoado === true || item.Amaldiçoado === "true";
const elementoCor = isAmald && item.Elemento in cores ? cores[item.Elemento] : "#333";

        const pesoUnitario = parseFloat(item.Peso) || 0;
        const qtd = parseInt(item.Quantidade) || 1;
        const pesoTotalItem = pesoUnitario * qtd;

        return (
          <div
            key={idx}
            style={{
              border: `2px solid ${elementoCor}`,
              background: `${elementoCor}22`,
              borderRadius: 8,
boxShadow: isAmald && item.Elemento in cores
  ? `inset 0 0 20px ${cores[item.Elemento]}AA`
  : "none",


              padding: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <strong>
  {item.Item} 
  {item.Quantidade && ` (x${item.Quantidade})`}
</strong>
{item.Amaldiçoado === "true" && (
  <span style={{ color: "red", marginLeft: 8 }}>⚠ Amaldiçoado</span>
)}

              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <FaEdit style={{ cursor: "pointer" }} onClick={() => {
  setNovo({ ...item, "ID da Ficha": fichaId }); // ✅ aqui
  setModoEdicao(true);
  setModoCriacao(false);
}} />

                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpandido(expandido === idx ? null : idx)}
                >
                  {expandido === idx ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </div>
            </div>
            {expandido === idx && (
              <div style={{ marginTop: 8, fontSize: 14 }}>
                <div><strong>Descrição:</strong> {item.Descrição}</div>
                <div><strong>Quantidade:</strong> {item.Quantidade} | <strong>Peso Total:</strong> {pesoTotalItem.toFixed(2)} kg</div>
                {item.Amaldiçoado === "true" && (
                  <div><strong>Elemento:</strong> {item.Elemento}</div>
                )}
                <button
                  onClick={() => deletarItem(item)}
                  style={{ marginTop: 8, background: "#800", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px" }}
                >
                  <FaTrash /> Excluir
                </button>
              </div>
            )}
          </div>
        );
      })}

      {(modoCriacao || modoEdicao) && (
        <div style={{ border: "2px solid #D4AF37", padding: 12, borderRadius: 8, background: "#111", marginTop: 16 }}>
          <h3 style={{ color: "#D4AF37" }}>{modoEdicao ? "Editar Item" : "Novo Item"}</h3>
          <input
            placeholder="Item"
            value={novo.Item}
            onChange={(e) => setNovo({ ...novo, Item: e.target.value })}
            style={inputStyle}
          />
          <textarea
            placeholder="Descrição"
            value={novo.Descrição}
            onChange={(e) => setNovo({ ...novo, Descrição: e.target.value })}
            style={inputStyle}
            rows={2}
          />
          <input
            placeholder="Quantidade"
            type="number"
            value={novo.Quantidade}
            onChange={(e) => setNovo({ ...novo, Quantidade: e.target.value })}
            style={inputStyle}
          />
          <input
            placeholder="Peso"
            value={novo.Peso}
            onChange={(e) => setNovo({ ...novo, Peso: e.target.value })}
            style={inputStyle}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <input
              type="checkbox"
              checked={novo.Amaldiçoado === true || novo.Amaldiçoado === "true"}
              onChange={(e) => setNovo({ ...novo, Amaldiçoado: e.target.checked })}
            />
            Amaldiçoado
          </label>
          {(novo.Amaldiçoado === true || novo.Amaldiçoado === "true") && (
            <select
              value={novo.Elemento}
              onChange={(e) => setNovo({ ...novo, Elemento: e.target.value })}
              style={inputStyle}
            >
              {ELEMENTOS.map((el) => (
                <option key={el} value={el}>{el}</option>
              ))}
            </select>
          )}
          <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
            <button onClick={salvarItem} style={{ background: "#D4AF37", color: "#000", padding: "6px 12px", borderRadius: 4 }}>
              Salvar
            </button>
            <button onClick={() => {
              setModoCriacao(false);
              setModoEdicao(null);
              setNovo({
                "ID da Ficha": fichaId,
                Item: "",
                Descrição: "",
                Quantidade: 1,
                Peso: "",
                Amaldiçoado: false,
                Elemento: "Sangue"
              });
            }} style={{ background: "#800", color: "#fff", padding: "6px 12px", borderRadius: 4 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 6,
  marginTop: 6,
  background: "#000",
  border: "1px solid #D4AF37",
  color: "#D4AF37",
  borderRadius: 4,
};
