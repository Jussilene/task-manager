import axios from "axios";

export function getApiBase(): string {
  // 1) Começa pelo valor do .env (se houver)
  let base = import.meta.env.VITE_API_BASE || "";

  // 2) Se estiver com "localhost", troca pelo host atual (funciona no celular usando seu IP da rede)
  if (base.includes("localhost")) {
    base = base.replace("localhost", window.location.hostname);
  }

  // 3) Se não tiver nada no .env, faz um fallback automático
  if (!base) {
    base = `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }

  return base;
}

// Instância axios para reusar em todo projeto
export const api = axios.create({
  baseURL: getApiBase(),
  withCredentials: true, // mantém cookies e sessões
});
