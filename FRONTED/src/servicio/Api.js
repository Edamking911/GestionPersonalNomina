// src/servicio/Api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
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
        // Guardar el mensaje en la respuesta por si se necesita después
        response.envelopeMessage = res.message;
        // Desenvolver: response.data = res.data
        response.data = res.data;
      } else {
        // Es un error envuelto
        const error = new Error(res.message || 'Error desconocido');
        error.response = { data: res, status: res.error || 500 };
        error.isEnvelopeError = true;
        return Promise.reject(error);
      }
    }

    // 🔑 Caso 2: Respuesta con success pero SIN data (ej. { success, message })
    // Se deja tal cual (el hook lo maneja como res.data.success)
    // No hay nada que hacer aquí

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
    return Promise.reject(error);
  }
);

export default api;