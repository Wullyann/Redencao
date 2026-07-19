// src/components/UploadImagem.jsx
import React, { useRef, useState } from "react";

const UPLOAD_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function UploadImagem({ imagemAtual = "", onUploadComplete }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(imagemAtual);
  const [uploading, setUploading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMensagem("Use uma imagem JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMensagem("A imagem deve ter no máximo 8 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.split(",")[1];

      if (!base64) {
        setMensagem("Não foi possível ler essa imagem.");
        return;
      }

      setPreview(dataUrl);
      setUploading(true);
      setMensagem("Enviando imagem...");

      try {
        // Sem cabeçalho personalizado para evitar bloqueio CORS do Google Apps Script.
        const response = await fetch(UPLOAD_ENDPOINT, {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            base64,
            contentType: file.type,
          }),
        });

        const responseText = await response.text();
        let json;

        try {
          json = JSON.parse(responseText);
        } catch {
          throw new Error("O servidor devolveu uma resposta inválida.");
        }

        const sucesso = json.status === "success" || json.status === "sucesso";
        const url = json.url || json.link;

        if (!sucesso || !url) {
          throw new Error(json.message || json.mensagem || "Falha no envio da imagem.");
        }

        setPreview(url);
        onUploadComplete?.(url);
        setMensagem("Imagem enviada. Clique em Salvar Ficha.");
      } catch (error) {
        console.error("Erro no upload da imagem:", error);
        setPreview(imagemAtual);
        setMensagem(`Erro: ${error.message}`);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      setMensagem("Não foi possível ler essa imagem.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        {(preview || imagemAtual) && (
          <img
            src={preview || imagemAtual}
            alt="Imagem atual do personagem"
            style={styles.preview}
          />
        )}

        <div>
          <div style={styles.title}>Imagem do personagem</div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              ...styles.button,
              opacity: uploading ? 0.6 : 1,
              cursor: uploading ? "wait" : "pointer",
            }}
          >
            {uploading ? "Enviando..." : preview || imagemAtual ? "Trocar imagem" : "Escolher imagem"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: "none" }}
          />
          <div style={styles.help}>JPG, PNG ou WEBP — máximo de 8 MB.</div>
        </div>
      </div>

      {mensagem && (
        <div style={{ ...styles.message, color: mensagem.startsWith("Erro") ? "#ff6b6b" : "#B2955D" }}>
          {mensagem}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginBottom: 18,
    padding: 12,
    border: "1px solid #D4AF37",
    borderRadius: 8,
    background: "#111",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  preview: {
    width: 74,
    height: 74,
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid #D4AF37",
    background: "#000",
  },
  title: {
    color: "#D4AF37",
    fontWeight: "bold",
    marginBottom: 8,
  },
  button: {
    padding: "7px 12px",
    background: "#D4AF37",
    color: "#000",
    fontWeight: "bold",
    border: "none",
    borderRadius: 6,
  },
  help: {
    marginTop: 7,
    color: "#7d6f53",
    fontSize: 12,
  },
  message: {
    marginTop: 10,
    fontSize: 13,
  },
};
