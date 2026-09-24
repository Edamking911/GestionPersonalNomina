// src/Context/PermisosContext.jsx
import { createContext, useContext, useState, useEffect, useMemo } from 'react';

// =========================================================
// 🎯 MAPA DE PERMISOS POR ROL
// =========================================================
// Este mapa es el "contrato" del módulo. Hoy no se usa (todo pasa),
// mañana cuando se implemente auth se alimentará del JWT.
//
// Los permisos se nombran con el patrón: "<modulo>.<accion>"
// '*' significa "todos los permisos".
// =========================================================
export const PERMISOS_POR_ROL = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['*'],
  RRHH: [
    'empleados.ver',
    'empleados.crear',
    'empleados.editar',
    'empleados.desactivar',
    'empleados.exportar',
  ],
  SUPERVISOR: ['empleados.ver'],
  EMPLEADO: [],
};

// =========================================================
// 🎭 MODO ACTUAL (SIN_AUTH) — mientras no haya login
// =========================================================
// Cuando implementes auth, esto se reemplaza por el rol del JWT
// =========================================================
const MODO_ACTUAL = 'SIN_AUTH'; // <-- cambiar a 'RRHH', 'ADMIN', etc. para probar

// =========================================================
// 🧠 CONTEXT
// =========================================================
const PermisosContext = createContext(null);

export function PermisosProvider({ children }) {
  const [rol, setRol] = useState(MODO_ACTUAL);

  // 🎯 Cuando implementes auth, aquí se lee el JWT/contexto global
  // y se hace setRol(rolDelUsuario)
  useEffect(() => {
    // Ejemplo futuro:
    // const usuario = obtenerUsuarioActual();
    // setRol(usuario?.rol || 'EMPLEADO');
  }, []);

  const permisos = useMemo(() => {
    return PERMISOS_POR_ROL[rol] || [];
  }, [rol]);

  const value = useMemo(() => {
    /**
     * Verifica si el usuario actual tiene un permiso.
     * @param {string} permiso — ej: 'empleados.editar'
     * @returns {boolean}
     */
    const puede = (permiso) => {
      if (permisos.includes('*')) return true;
      return permisos.includes(permiso);
    };

    const esRol = (...roles) => roles.includes(rol);

    return {
      rol,
      setRol,
      permisos,
      puede,
      esRol,
      tieneAuth: rol !== 'SIN_AUTH',
    };
  }, [rol, permisos]);

  return (
    <PermisosContext.Provider value={value}>
      {children}
    </PermisosContext.Provider>
  );
}

// =========================================================
// 🪝 HOOK
// =========================================================
export function usePermisos() {
  const ctx = useContext(PermisosContext);
  if (!ctx) {
    throw new Error('usePermisos debe usarse dentro de <PermisosProvider>');
  }
  return ctx;
}

// =========================================================
// 🛡️ COMPONENTE HELPER: oculta children sin permiso
// =========================================================
export function ConPermiso({ permiso, children, fallback = null }) {
  const { puede } = usePermisos();
  if (!puede(permiso)) return fallback;
  return children;
}