const DEFAULT_API_URL =
  "https://script.google.com/macros/s/AKfycbxuerpEz0bT5UO6tNPZnMJikScsM7HbYJU1X35YcbdNF54baV8IpceP3PQDLpGuKuMQoQ/exec";

export const API_URL = String(import.meta.env.VITE_APPS_SCRIPT_URL || DEFAULT_API_URL).trim();
export const SESSION_STORAGE_KEY = "redencao:sessao:v13";
export const LEGACY_USER_KEY = "usuario";

export class ApiError extends Error {
  constructor(message, payload = null) {
    super(message);
    this.name = "ApiError";
    this.payload = payload;
  }
}

export function getStoredSession() {
  try {
    const current = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
    if (current?.token && current?.usuario) return current;
    const legacy = JSON.parse(localStorage.getItem(LEGACY_USER_KEY) || "null");
    if (legacy?.token && legacy?.usuario) {
      return { token: legacy.token, usuario: legacy, expiraEm: legacy.expiraEm || "" };
    }
    return null;
  } catch {
    return null;
  }
}

export function getStoredUser() {
  const session = getStoredSession();
  if (session?.usuario) return session.usuario;
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_USER_KEY) || "null");
    return legacy?.usuario && legacy?.tipo ? legacy : null;
  } catch {
    return null;
  }
}

export function getSessionToken() {
  return getStoredSession()?.token || "";
}

export function storeSession(payload) {
  const session = {
    token: payload.token,
    expiraEm: payload.expiraEm || "",
    usuario: payload.usuario,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(
    LEGACY_USER_KEY,
    JSON.stringify({ ...payload.usuario, token: payload.token, expiraEm: payload.expiraEm || "" })
  );
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.status === "erro" || payload?.status === "error") {
    const message = payload.mensagem || payload.message || "Erro na comunicação com o servidor.";
    if (/sess[aã]o|token|autentica/i.test(message)) {
      clearSession();
      window.dispatchEvent(new CustomEvent("redencao:session-expired"));
    }
    throw new ApiError(message, payload);
  }
  return payload;
}

async function parseResponse(response) {
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(`Resposta inválida do servidor (${response.status}).`);
  }
  if (!response.ok) {
    throw new ApiError(payload?.mensagem || payload?.message || `Erro HTTP ${response.status}.`, payload);
  }
  return normalizePayload(payload);
}

export async function apiGet(params = {}, options = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  if (!options.public && !query.has("token")) {
    const token = getSessionToken();
    if (token) query.set("token", token);
  }
  query.set("_", String(Date.now()));
  const response = await fetch(`${API_URL}?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
    signal: options.signal,
  });
  return parseResponse(response);
}

export async function apiGetSheet(sheet, options = {}) {
  return apiGet({ sheet }, options);
}

export async function apiPost(action, payload = {}, options = {}) {
  const token = options.public ? "" : getSessionToken();
  let body;
  let headers;

  if (options.json) {
    body = JSON.stringify({ acao: action, ...(token ? { token } : {}), ...payload });
    headers = { "Content-Type": "text/plain;charset=utf-8" };
  } else {
    const params = new URLSearchParams();
    params.set("acao", action);
    if (token) params.set("token", token);
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      params.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    });
    body = params;
  }

  const response = await fetch(API_URL, {
    method: "POST",
    body,
    headers,
    signal: options.signal,
  });
  return parseResponse(response);
}

export async function login(usuario, senha) {
  return apiPost("login", { usuario, senha }, { public: true });
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}
