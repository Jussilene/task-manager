import axios from "axios";

/** URLs fixas */
const PROD_API = "https://task-manager-qi34.onrender.com/api";
const DEV_API  = "http://localhost:4000/api";

/** 
 * 1ª prioridade: variável de ambiente do Vite (setada no Render)
 * 2ª prioridade: se o host termina com onrender.com => produção
 * 3ª prioridade: fallback pelo modo do Vite (dev/prod)
 */
const fromEnv = (import.meta as any).env?.VITE_API_BASE as string | undefined;

const API_URL =
  (fromEnv && fromEnv.trim()) ||
  (typeof window !== "undefined" && location.hostname.endsWith("onrender.com")
    ? PROD_API
    : (import.meta.env.MODE === "production" ? PROD_API : DEV_API));

/** Helpers de auth no localStorage */
type AuthData = { token: string; user?: { id: string; name?: string; email?: string } };

function loadAuth(): AuthData | null {
  try { const raw = localStorage.getItem("auth"); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveAuth(data: AuthData) { try { localStorage.setItem("auth", JSON.stringify(data)); } catch {} }
function clearAuth() { try { localStorage.removeItem("auth"); } catch {} }

/** Instância do axios (manda cookies quando houver) */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/** Antes de cada request: adiciona Authorization se houver token salvo */
api.interceptors.request.use((config) => {
  const auth = loadAuth();
  if (auth?.token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

/** Depois da response: se vier {token, user} salva automaticamente */
api.interceptors.response.use(
  (resp) => {
    const data = resp?.data as any;
    if (data && typeof data === "object" && data.token) {
      saveAuth({ token: data.token, user: data.user });
    }
    return resp;
  },
  (err) => {
    if (err?.response?.status === 401) clearAuth();
    return Promise.reject(err);
  }
);

export const BASE_API_URL = API_URL;
