import React, { useEffect, useMemo, useState } from "react";

const imageCache = new Map();

export function extractDriveFileId(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("drive:")) return text.slice(6).trim();

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
}

function driveCandidates(fileId) {
  if (!fileId) return [];
  const id = encodeURIComponent(fileId);
  return [
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
    `https://lh3.googleusercontent.com/d/${id}=w2000`,
    `https://drive.usercontent.google.com/download?id=${id}&export=view`,
  ];
}

export default function SecureDriveImage({
  file = null,
  source = "",
  alt = "",
  className = "",
  stateClassName = "",
}) {
  const rawSource = String(source || file?.["Miniatura URL"] || file?.URL || "").trim();
  const driveId = String(file?.["Drive File ID"] || extractDriveFileId(rawSource)).trim();
  const cacheKey = rawSource || driveId || String(file?.ID || "");

  const candidates = useMemo(() => {
    const values = [
      rawSource,
      file?.["Miniatura URL"],
      file?.URL,
      ...driveCandidates(driveId),
    ];
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
  }, [driveId, file, rawSource]);

  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState(candidates.length ? "loading" : "error");
  const cached = imageCache.get(cacheKey);
  const src = cached || candidates[index] || "";

  useEffect(() => {
    setIndex(0);
    setStatus(candidates.length ? "loading" : "error");
  }, [cacheKey, candidates.length]);

  if (!src || status === "error") {
    return <div className={`${stateClassName} is-error`.trim()}>Não foi possível exibir a imagem.</div>;
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      draggable="false"
      referrerPolicy="no-referrer"
      onLoad={() => {
        imageCache.set(cacheKey, src);
        setStatus("ready");
      }}
      onError={() => {
        imageCache.delete(cacheKey);
        const next = index + 1;
        if (next < candidates.length) {
          setIndex(next);
          setStatus("loading");
        } else {
          setStatus("error");
        }
      }}
    />
  );
}
