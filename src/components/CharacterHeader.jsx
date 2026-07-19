// src/components/CharacterHeader.jsx
import React, { useRef, useState } from "react";
import { obterTokenPortrait } from "../utils/portraitRealtime";

const CLASSES = ["Combatente", "Especialista", "Ocultista"];
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 8 * 1024 * 1024;
const LIMITE_TEXTO_PLANILHA = 47000;

function lerArquivoComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
    image.src = src;
  });
}

async function prepararAvatar(file) {
  const dataUrlOriginal = await lerArquivoComoDataUrl(file);
  const image = await carregarImagem(dataUrlOriginal);

  // Recorta a região central para a foto encaixar corretamente no círculo.
  const ladoOriginal = Math.min(image.naturalWidth, image.naturalHeight);
  const origemX = (image.naturalWidth - ladoOriginal) / 2;
  const origemY = (image.naturalHeight - ladoOriginal) / 2;

  const tentativas = [
    { tamanho: 320, qualidade: 0.82 },
    { tamanho: 280, qualidade: 0.76 },
    { tamanho: 240, qualidade: 0.7 },
    { tamanho: 200, qualidade: 0.64 },
  ];

  for (const tentativa of tentativas) {
    const canvas = document.createElement("canvas");
    canvas.width = tentativa.tamanho;
    canvas.height = tentativa.tamanho;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("O navegador não conseguiu preparar a imagem.");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      origemX,
      origemY,
      ladoOriginal,
      ladoOriginal,
      0,
      0,
      canvas.width,
      canvas.height
    );

    let resultado = canvas.toDataURL("image/webp", tentativa.qualidade);

    // Navegadores antigos podem não gerar WEBP pelo canvas.
    if (!resultado.startsWith("data:image/webp")) {
      resultado = canvas.toDataURL("image/jpeg", tentativa.qualidade);
    }

    if (resultado.length <= LIMITE_TEXTO_PLANILHA) return resultado;
  }

  throw new Error("A imagem continuou muito grande. Escolha outra imagem.");
}

export default function CharacterHeader({
  ficha,
  imagemUrl = "",
  onImagemChange,
  onClasseChange,
}) {
  const inputRef = useRef(null);
  const [processando, setProcessando] = useState(false);
  const [mensagemImagem, setMensagemImagem] = useState("");
  const [imagemComErro, setImagemComErro] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const nome = ficha["Nome do Personagem"] || "Personagem";
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  const imagemExibida = imagemUrl || ficha["Imagem do Personagem"] || "";
  const portraitToken = obterTokenPortrait(ficha.ID);
  const portraitUrl = `${window.location.origin}/portrait/${encodeURIComponent(ficha.ID)}?token=${encodeURIComponent(portraitToken)}`;

  const copiarLinkPortrait = async () => {
    try {
      await navigator.clipboard.writeText(portraitUrl);
      setLinkCopiado(true);
      window.setTimeout(() => setLinkCopiado(false), 2200);
    } catch {
      window.prompt("Copie o link do Portrait para o OBS:", portraitUrl);
    }
  };

  const selecionarImagem = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setMensagemImagem("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > TAMANHO_MAXIMO) {
      setMensagemImagem("A imagem deve ter no máximo 8 MB.");
      return;
    }

    setProcessando(true);
    setMensagemImagem("Preparando imagem...");

    try {
      const avatar = await prepararAvatar(file);
      setImagemComErro(false);
      onImagemChange?.(avatar);
      setMensagemImagem("Imagem alterada — clique em Salvar Ficha.");
    } catch (error) {
      console.error("Erro ao preparar avatar:", error);
      setMensagemImagem(error.message || "Não foi possível usar essa imagem.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processando}
          title="Clique para alterar a imagem do personagem"
          aria-label="Alterar imagem do personagem"
          style={{
            ...styles.avatarButton,
            cursor: processando ? "wait" : "pointer",
          }}
        >
          {imagemExibida && !imagemComErro ? (
            <img
              src={imagemExibida}
              alt={nome}
              onError={() => setImagemComErro(true)}
              style={styles.avatar}
            />
          ) : (
            <span style={styles.placeholder}>{iniciais || "?"}</span>
          )}

        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={selecionarImagem}
          style={{ display: "none" }}
        />

        <div style={styles.info}>
          <h2 style={styles.name}>{nome}</h2>
          <div style={styles.nex}>NEX: {ficha.NEX}%</div>
          <div style={styles.portraitActions}>
            <button
              type="button"
              onClick={() => window.open(portraitUrl, "_blank", "noopener,noreferrer")}
              style={styles.portraitButton}
            >
              Abrir Portrait
            </button>
            <button
              type="button"
              onClick={copiarLinkPortrait}
              style={styles.portraitButtonSecondary}
            >
              {linkCopiado ? "Link copiado!" : "Copiar link OBS"}
            </button>
          </div>
          {mensagemImagem && (
            <div
              style={{
                ...styles.imageMessage,
                color:
                  mensagemImagem.startsWith("Use") ||
                  mensagemImagem.startsWith("A imagem") ||
                  mensagemImagem.startsWith("Não")
                    ? "#ff6b6b"
                    : "#B2955D",
              }}
            >
              {mensagemImagem}
            </div>
          )}
        </div>

        <select
          value={ficha.Classe}
          onChange={(event) => onClasseChange(event.target.value)}
          style={styles.classSelect}
        >
          {CLASSES.map((classe) => (
            <option key={classe} value={classe}>
              {classe}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    marginBottom: 24,
  },
  container: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  avatarButton: {
    position: "relative",
    width: 86,
    height: 86,
    minWidth: 86,
    padding: 0,
    borderRadius: "50%",
    border: "2px solid #D4AF37",
    overflow: "hidden",
    background: "#111",
    color: "#D4AF37",
    boxShadow: "0 0 0 2px rgba(212, 175, 55, 0.08)",
  },
  avatar: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
  },
  placeholder: {
    display: "flex",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    fontWeight: "bold",
    color: "#D4AF37",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 24,
  },
  nex: {
    marginTop: 4,
    color: "#D4AF37",
    fontWeight: "bold",
    fontSize: 16,
  },
  portraitActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  portraitButton: {
    padding: "5px 9px",
    border: "1px solid #D4AF37",
    borderRadius: 5,
    background: "#D4AF37",
    color: "#000",
    fontSize: 11,
    fontWeight: "bold",
    cursor: "pointer",
  },
  portraitButtonSecondary: {
    padding: "5px 9px",
    border: "1px solid #D4AF37",
    borderRadius: 5,
    background: "transparent",
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "bold",
    cursor: "pointer",
  },
  imageMessage: {
    marginTop: 5,
    maxWidth: 260,
    fontSize: 12,
    lineHeight: 1.25,
  },
  classSelect: {
    padding: "6px 12px",
    background: "#000",
    border: "1px solid #D4AF37",
    borderRadius: 4,
    color: "#D4AF37",
    fontSize: 14,
    cursor: "pointer",
  },
};
