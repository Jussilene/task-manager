import axios from "axios";

/** Em dev usa a API local; em produção usa a API do Render */
const API_URL = import.meta.env.DEV
  ? "http://localhost:4000/api"
  : "https://task-manager-qi34.onrender.com/api";

/** Le e grava auth no localStorage */
type AuthData = { token: string; user?: { id: string; name?: string; email?: string } };

function loadAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveAuth(data: AuthData) {
  try {
    localStorage.setItem("auth", JSON.stringify(data));
  } catch {}
}
function clearAuth() {
  try {
    localStorage.removeItem("auth");
  } catch {}
}

/** Instância do axios (envia cookies quando houver) */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/** Antes de cada request: adiciona Authorization: Bearer <token> se existir */
api.interceptors.request.use((config) => {
  const auth = loadAuth();
  if (auth?.token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

/** Depois de cada response:
 * - Se vier { token, user }, salva no localStorage automaticamente (login/register)
 * - Se a API responder 401 em rotas protegidas, limpa auth
 */
api.interceptors.response.use(
  (response) => {
    const data = response?.data as any;
    if (data && typeof data === "object" && data.token) {
      saveAuth({ token: data.token, user: data.user });
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearAuth();
    }
    return Promise.reject(error);
  }
);

export const BASE_API_URL = API_URL;
