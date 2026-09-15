// src/servicio/Api.js
import axios from 'axios';

// =========================================================
// 🔍 Detectar automáticamente el host del backend
// =========================================================
// - En PC: localhost:5173 → llama a localhost:3000
// - En móvil: 192.168.x.x:5173 → llama a 192.168.x.x:3000
// - Si hay VITE_API_URL en .env → la usa siempre
// =========================================================
const getBaseURL = () => {
  // 1. Variable de entorno (opcional, prioridad alta)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Detectar automáticamente el host actual
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    // El backend corre en el puerto 3000
    return `${protocol}//${hostname}:3000`;
  }

  // 3. Fallback
  return 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 60000,
});

/**
 * 🔑 Interceptor de respuestas
 * - Desenvuelve { success, data, message, error } automáticamente
 * - Deja pasar blobs (Excel) sin tocar
 * - Maneja errores con el nuevo formato
 */
api.interceptors.response.use(
  (response) => {
    // 🔑 Si es blob (descarga de Excel), dejar pasar sin tocar
    if (response.config.responseType === 'blob') {
      return response;
    }

    const res = response.data;

    // 🔑 Si no es un objeto, dejar pasar
    if (!res || typeof res !== 'object') {
      return response;
    }

    // 🔑 Caso 1: Respuesta envuelta con { success, data, message, error }
    if ('success' in res && 'data' in res) {
      if (res.success) {
        response.envelopeMessage = res.message;
        response.data = res.data;
      } else {
        const error = new Error(res.message || 'Error desconocido');
        error.response = { data: res, status: res.error || 500 };
        error.isEnvelopeError = true;
        return Promise.reject(error);
      }
    }

    return response;
  },
  (error) => {
    // 🔑 Manejo de errores HTTP (4xx, 5xx)
    if (error.response?.data) {
      const res = error.response.data;
      if ('success' in res && 'message' in res) {
        error.message = res.message || error.message;
        error.statusCode = res.error || error.response.status;
      }
    }

    // 🔍 Log útil para debug
    console.error(
      `❌ API Error [${error.config?.method?.toUpperCase()} ${error.config?.url}]:`,
      error.message,
    );

    return Promise.reject(error);
  },
);

export default api;