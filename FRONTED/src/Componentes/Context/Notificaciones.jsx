// src/Componentes/Context/NotificationContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'biometrico-notifications';
const MAX_NOTIFICACIONES = 50;

export function NotificationProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);

  // Cargar del localStorage al montar
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const lista = JSON.parse(guardado);
        if (Array.isArray(lista)) setNotificaciones(lista);
      }
    } catch {}
  }, []);

  // Guardar en localStorage cada vez que cambie
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notificaciones));
    } catch {}
  }, [notificaciones]);

  // Agregar notificación
  const agregarNotificacion = useCallback(
    ({ tipo = 'info', titulo = '', mensaje = '', icono = null }) => {
      const nueva = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tipo,
        titulo,
        mensaje,
        icono,
        timestamp: Date.now(),
        leida: false,
      };

      setNotificaciones((prev) => [nueva, ...prev].slice(0, MAX_NOTIFICACIONES));
      return nueva.id;
    },
    [],
  );

  // Marcar una como leída
  const marcarLeida = useCallback((id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
  }, []);

  // Marcar todas como leídas
  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }, []);

  //  Eliminar una
  const eliminarNotificacion = useCallback((id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }, []);

  //  Limpiar todas
  const limpiarTodas = useCallback(() => {
    setNotificaciones([]);
  }, []);

  // No leídas
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <NotificationContext.Provider
      value={{
        notificaciones,
        noLeidas,
        agregarNotificacion,
        marcarLeida,
        marcarTodasLeidas,
        eliminarNotificacion,
        limpiarTodas,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificaciones() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      'useNotificaciones debe usarse dentro de un NotificationProvider',
    );
  }
  return ctx;
}