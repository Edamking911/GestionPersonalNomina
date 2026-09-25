// src/Hoosk/usePersistedState.js
import { useState, useEffect, useRef } from 'react';

/**
 * Como useState, pero persiste en localStorage (o sessionStorage).
 *
 * @param {string} key - Clave en storage
 * @param {any} defaultValue - Valor inicial si no hay nada guardado
 * @param {object} options
 *   - storage: 'local' | 'session' (default 'local')
 *   - ttl: ms para expirar (opcional)
 */
export function usePersistedState(key, defaultValue, options = {}) {
  const { storage = 'local', ttl } = options;

  const storageObj =
    storage === 'session' ? window.sessionStorage : window.localStorage;

  // Leer valor inicial
  const [state, setState] = useState(() => {
    try {
      const raw = storageObj.getItem(key);
      if (!raw) return defaultValue;

      const parsed = JSON.parse(raw);

      // Verificar expiración
      if (ttl && parsed?.__expires && Date.now() > parsed.__expires) {
        storageObj.removeItem(key);
        return defaultValue;
      }

      return parsed?.__value !== undefined ? parsed.__value : parsed;
    } catch {
      return defaultValue;
    }
  });

  // guarda cuando cambia
  useEffect(() => {
    try {
      const toSave = ttl
        ? { __value: state, __expires: Date.now() + ttl }
        : state;
      storageObj.setItem(key, JSON.stringify(toSave));
    } catch (err) {
      // Storage lleno o bloqueado — no crashear
      console.warn(`[usePersistedState] Error al guardar "${key}":`, err);
    }
  }, [key, state, storageObj, ttl]);

  return [state, setState];
}