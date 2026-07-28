import { API_URL, getSessionToken } from "./api";

const LEGACY_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

let installed = false;

function isDedicatedMediaUpload(body) {
  if (typeof body !== "string") return false;
  try {
    const parsed = JSON.parse(body);
    return parsed?.redencaoMediaUpload === true;
  } catch {
    return false;
  }
}

function isRedencaoEndpoint(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return (
      parsed.href.startsWith(LEGACY_ENDPOINT) ||
      parsed.href.startsWith(API_URL) ||
      (parsed.hostname === "script.google.com" && parsed.pathname.includes("/macros/s/"))
    );
  } catch {
    return false;
  }
}

function rewriteUrl(input) {
  const original = new URL(typeof input === "string" ? input : input.url, window.location.href);
  const target = new URL(API_URL);
  original.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  return target;
}

function withTokenInBody(body, token) {
  if (!token || !body) return body;

  if (body instanceof URLSearchParams) {
    const copy = new URLSearchParams(body);
    if (!copy.has("token")) copy.set("token", token);
    return copy;
  }

  if (body instanceof FormData) {
    if (!body.has("token")) body.append("token", token);
    return body;
  }

  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        if (!parsed.token) parsed.token = token;
        if (!parsed.acao && parsed.fileName && parsed.base64) parsed.acao = "uploadImagemPersonagem";
        return JSON.stringify(parsed);
      }
    } catch {
      const params = new URLSearchParams(body);
      if (!params.has("token")) params.set("token", token);
      return params.toString();
    }
  }

  return body;
}

/**
 * Mantém os componentes antigos funcionando enquanto todas as chamadas passam
 * pelo endpoint configurado e recebem o token da sessão v13.
 */
export function installLegacyApiCompatibility() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const rawUrl = typeof input === "string" ? input : input?.url;
    if (!rawUrl || !isRedencaoEndpoint(rawUrl)) return nativeFetch(input, init);

    // Uploads de mídia usam o mesmo endpoint antigo das imagens dos jogadores.
    // Não reescrevemos essa chamada para a API v13, evitando o DriveApp que
    // está sendo negado na implantação nova.
    if (rawUrl.startsWith(LEGACY_ENDPOINT) && isDedicatedMediaUpload(init?.body)) {
      return nativeFetch(input, init);
    }

    const url = rewriteUrl(input);
    const next = { ...init };
    const method = String(next.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    const token = getSessionToken();

    if (method === "GET" || method === "HEAD") {
      if (token && !url.searchParams.has("token")) url.searchParams.set("token", token);
    } else {
      next.body = withTokenInBody(next.body, token);
      if (typeof next.body === "string" && next.body.trim().startsWith("{")) {
        const headers = new Headers(next.headers || {});
        // Evita preflight CORS desnecessário no Apps Script.
        headers.set("Content-Type", "text/plain;charset=utf-8");
        next.headers = headers;
      }
    }

    return nativeFetch(url.toString(), next);
  };
}
