import axios from "axios";

// Escolhe a URL conforme o ambiente:
// - DEV: quando você roda `npm run dev` no seu PC
// - PRODUÇÃO: quando o site está buildado e publicado no Render
const API_URL = import.meta.env.DEV
  ? "http://localhost:4000/api"
  : "https://task-manager-qi34.onrender.com/api";

// (Opcional) exporta se você quiser usar a base em outros arquivos
export const BASE_API_URL = API_URL;

// Instância do axios reutilizável
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // mantém cookies/sessões
});
