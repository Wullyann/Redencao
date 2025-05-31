// src/components/UploadImagem.jsx
import React, { useState } from "react";

const UPLOAD_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

export default function UploadImagem({ onUploadComplete }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1];
      const contentType = dataUrl.match(/^data:(image\/\w+);base64,/)[1];

      setUploading(true);

      fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          base64,
          contentType,
        }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.status === "success") {
            onUploadComplete(json.url); // retorna a URL para o componente pai
            setPreview(json.url);
          } else {
            alert("Erro ao enviar imagem: " + json.message);
          }
        })
        .catch((err) => {
          console.error(err);
          alert("Erro ao fazer upload da imagem.");
        })
        .finally(() => setUploading(false));
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 8 }}>
        Foto do personagem:
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      </label>
      {preview && (
        <img
          src={preview}
          alt="Pré-visualização"
          style={{ maxWidth: 180, borderRadius: 8, border: "1px solid #D4AF37" }}
        />
      )}
    </div>
  );
}
