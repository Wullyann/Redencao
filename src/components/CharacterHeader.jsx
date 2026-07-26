import React, { useRef, useState } from "react";
import { Copy, ExternalLink, Radio, UserRound } from "lucide-react";
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
  const origem = ficha.Origem || ficha["Origem"] || "Origem não informada";
  const trilha = ficha.Trilha || ficha["Trilha"] || "Agente em campo";
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
    setMensagemImagem("Preparando retrato...");
    try {
      const avatar = await prepararAvatar(file);
      setImagemComErro(false);
      onImagemChange?.(avatar);
      setMensagemImagem("Retrato alterado. Salve a ficha para confirmar.");
    } catch (error) {
      console.error("Erro ao preparar avatar:", error);
      setMensagemImagem(error.message || "Não foi possível usar essa imagem.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="character-identity">
      <button
        type="button"
        className="character-avatar-button"
        onClick={() => inputRef.current?.click()}
        disabled={processando}
        title="Clique para alterar o retrato"
        aria-label="Alterar retrato do personagem"
      >
        {imagemExibida && !imagemComErro ? (
          <img
            src={imagemExibida}
            alt={nome}
            onError={() => setImagemComErro(true)}
          />
        ) : (
          <span>{iniciais || <UserRound size={38} />}</span>
        )}
        <i>{processando ? "Processando" : "Alterar retrato"}</i>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={selecionarImagem}
        hidden
      />

      <div className="character-main-info">
        <div className="character-kicker"><Radio size={14} /> AGENTE CONECTADO</div>
        <h1>{nome}</h1>
        <div className="character-meta-line">
          <span className="character-nex">NEX {ficha.NEX || 0}%</span>
          <span>{origem}</span>
          <span>{trilha}</span>
        </div>

        <div className="character-controls">
          <label>
            <span>Classe</span>
            <select value={ficha.Classe || CLASSES[0]} onChange={(event) => onClasseChange(event.target.value)}>
              {CLASSES.map((classe) => (
                <option key={classe} value={classe}>{classe}</option>
              ))}
            </select>
          </label>

          <div className="character-portrait-actions">
            <button type="button" onClick={() => window.open(portraitUrl, "_blank", "noopener,noreferrer")}>
              <ExternalLink size={16} /> Abrir Portrait
            </button>
            <button type="button" onClick={copiarLinkPortrait}>
              <Copy size={16} /> {linkCopiado ? "Link copiado" : "Copiar link OBS"}
            </button>
          </div>
        </div>

        {mensagemImagem && (
          <div className={`character-image-message ${mensagemImagem.startsWith("Use") || mensagemImagem.startsWith("A imagem") || mensagemImagem.startsWith("Não") ? "is-error" : ""}`}>
            {mensagemImagem}
          </div>
        )}
      </div>
    </div>
  );
}
