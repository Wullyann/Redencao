// Mídias pequenas salvas diretamente na planilha, do mesmo modo usado pelo
// retrato dos personagens. Não chama endpoint de upload e não usa DriveApp.

const MAX_SOURCE_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_INLINE_TEXT_LENGTH = 44000;
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export const EXTERNAL_MEDIA_PREFIX = "media-inline:";
const LEGACY_MEDIA_PREFIX = "media-redencao:";

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
    image.src = source;
  });
}

function fitSize(width, height, maxSide) {
  const largest = Math.max(width, height);
  if (!largest || largest <= maxSide) return { width, height };
  const scale = maxSide / largest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function prepareInlineImage(file) {
  const original = await readAsDataUrl(file);

  // GIF só pode ser mantido animado sem passar pelo canvas. Como uma célula da
  // planilha tem limite de texto, aceitamos apenas GIFs realmente pequenos.
  if (file.type === "image/gif") {
    if (original.length <= MAX_INLINE_TEXT_LENGTH) return original;
    throw new Error("O GIF é grande demais para ser salvo na planilha. Use uma imagem PNG, JPG ou WEBP menor.");
  }

  const image = await loadImage(original);
  const attempts = [
    { maxSide: 900, quality: 0.82 },
    { maxSide: 760, quality: 0.76 },
    { maxSide: 640, quality: 0.70 },
    { maxSide: 520, quality: 0.64 },
    { maxSide: 420, quality: 0.58 },
    { maxSide: 340, quality: 0.52 },
    { maxSide: 280, quality: 0.46 },
  ];

  for (const attempt of attempts) {
    const size = fitSize(image.naturalWidth, image.naturalHeight, attempt.maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("O navegador não conseguiu preparar a imagem.");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let result = canvas.toDataURL("image/webp", attempt.quality);
    if (!result.startsWith("data:image/webp")) {
      result = canvas.toDataURL("image/jpeg", attempt.quality);
    }
    if (result.length <= MAX_INLINE_TEXT_LENGTH) return result;
  }

  throw new Error("A imagem continuou grande demais. Escolha uma imagem mais simples ou menor.");
}

export async function uploadMediaFile(file, { fileName } = {}) {
  if (!file) throw new Error("Arquivo não informado.");

  const type = String(file.type || "").toLowerCase();
  if (type === "application/pdf") {
    throw new Error("PDF precisa do armazenamento no Drive. Nesta correção, imagens funcionam sem Drive; PDFs permanecem indisponíveis enquanto o DriveApp estiver bloqueado.");
  }
  if (!IMAGE_TYPES.has(type)) {
    throw new Error("Formato não permitido. Use PNG, JPG, JPEG, WEBP ou GIF pequeno.");
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("A imagem deve ter no máximo 8 MB antes da compactação.");
  }

  const url = await prepareInlineImage(file);
  return {
    url,
    name: fileName || file.name || "imagem",
    mime: url.startsWith("data:image/webp") ? "image/webp" : type,
    size: url.length,
    inline: true,
  };
}

export function encodeExternalMedia(media) {
  const payload = {
    u: String(media?.url || ""),
    n: String(media?.name || "imagem"),
    m: String(media?.mime || "image/webp"),
    s: Number(media?.size) || 0,
  };
  const encoded = `${EXTERNAL_MEDIA_PREFIX}${JSON.stringify(payload)}`;
  if (encoded.length > 49000) {
    throw new Error("A imagem ficou grande demais para a célula da planilha.");
  }
  return encoded;
}

export function decodeExternalMedia(value) {
  const text = String(value || "").trim();

  if (text.startsWith(EXTERNAL_MEDIA_PREFIX)) {
    try {
      const parsed = JSON.parse(text.slice(EXTERNAL_MEDIA_PREFIX.length));
      if (!parsed?.u) return null;
      return {
        ID: "",
        Nome: parsed.n || "imagem",
        MIME: parsed.m || "image/webp",
        URL: parsed.u,
        "Miniatura URL": parsed.u,
        Tamanho: Number(parsed.s) || 0,
        Externo: true,
        Inline: true,
      };
    } catch {
      return null;
    }
  }

  // Continua lendo cartões criados pelas versões 13.3/13.4.
  if (text.startsWith(LEGACY_MEDIA_PREFIX)) {
    try {
      const parsed = JSON.parse(decodeURIComponent(text.slice(LEGACY_MEDIA_PREFIX.length)));
      if (!parsed?.url) return null;
      return {
        ID: "",
        Nome: parsed.name || "arquivo",
        MIME: parsed.mime || "application/octet-stream",
        URL: parsed.url,
        "Miniatura URL": String(parsed.mime || "").startsWith("image/") ? parsed.url : "",
        Tamanho: Number(parsed.size) || 0,
        Externo: true,
      };
    } catch {
      return null;
    }
  }

  return null;
}
