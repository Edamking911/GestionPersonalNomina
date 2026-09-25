// src/utils/validaciones.js
// =========================================================
// 🛡️ SISTEMA DE VALIDACIÓN ANTI-INYECCIÓN / ANTI-XSS
// =========================================================
// Estrategia: si el input tiene CUALQUIER patrón sospechoso,
// se RECHAZA el input completo (no se intenta limpiar).
// =========================================================

// 🚫 Patrones peligrosos
const PATRONES_PELIGROSOS = [
  // SQL keywords (con word boundary para no romper palabras legítimas)
  /\b(drop|delete|insert|update|select|union|alter|create|truncate|exec|execute|declare|xp_|sp_|information_schema|sysobjects|master|load_file|outfile|dumpfile)\b/i,

  // Comentarios SQL
  /--/,
  /\/\*|\*\//,
  /#/,

  // Statement separator
  /;/,

  // Comillas (sirven para cerrar strings en SQL)
  /['"`]/,

  // XSS / HTML
  /<script|<\/script|<iframe|javascript:|onerror=|onclick=|onload=|onmouse|<img|<svg/i,

  // Path traversal
  /\.\.\//,
  /\.\.\\/,

  // Comandos shell
  /[|&$`]/,

  // Inyección clásica: ' OR 1=1 --
  /\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
];

/**
 * ¿El texto tiene algo peligroso?
 */
export const tieneCaracteresPeligrosos = (texto) => {
  if (!texto || typeof texto !== 'string') return false;
  return PATRONES_PELIGROSOS.some((p) => p.test(texto));
};

// =========================================================
// 🧼 SANITIZADORES (rechazan si hay algo raro)
// =========================================================

/**
 * Sanitiza nombre de persona (Juan, María-José, O'Brien)
 * Permite: letras, espacios, apóstrofes, guiones, puntos
 */
export const sanitizarNombre = (texto) => {
  if (!texto || typeof texto !== 'string') return '';

  if (tieneCaracteresPeligrosos(texto)) return '';

  return texto
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'.-]/g, '')
    .slice(0, 100);
  // ✅ SIN trim() — el trim se hace al validar
};

/**
 * Sanitiza nombre de cargo/departamento (más estricto)
 * Permite: letras, números, espacios, puntos
 * NO permite: guiones, apóstrofes
 */
export const sanitizarNombreEntidad = (texto) => {
  if (!texto || typeof texto !== 'string') return '';

  if (tieneCaracteresPeligrosos(texto)) return '';

  return texto
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s.]/g, '')
    .slice(0, 100);
  // ✅ SIN trim() — el trim se hace al validar
};

/**
 * Sanitiza texto libre (descripciones, motivos)
 */
export const sanitizarTexto = (texto) => {
  if (!texto || typeof texto !== 'string') return '';

  const limpio = texto.trim();

  if (tieneCaracteresPeligrosos(limpio)) return '';

  return limpio
    .replace(/\s+/g, ' ')
    .replace(/[<>{}[\]\\]/g, '')
    .replace(/['";]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*|\*\//g, '')
    .slice(0, 200)
    .trim();
};

export const sanitizarCedula = (texto) => {
  if (!texto) return '';
  return String(texto).replace(/\D/g, '').slice(0, 10);
};

export const sanitizarTelefono = (texto) => {
  if (!texto) return '';
  return String(texto).replace(/[^\d+\-() ]/g, '').slice(0, 20);
};

export const sanitizarEmail = (texto) => {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .trim()
    .toLowerCase()
    .replace(/[<>{}[\]\\;'"`]/g, '')
    .slice(0, 100);
};

// =========================================================
// ✅ VALIDADORES POR CAMPO
// =========================================================

export const validarCedula = (cedula) => {
  const limpia = sanitizarCedula(cedula);
  if (!limpia) return { valido: false, error: 'La cédula es obligatoria' };
  if (limpia.length < 6 || limpia.length > 10)
    return { valido: false, error: 'La cédula debe tener entre 6 y 10 dígitos' };
  if (/^0+$/.test(limpia)) return { valido: false, error: 'Cédula inválida' };
  return { valido: true, valor: limpia };
};

export const validarNombre = (nombre, campo = 'nombre') => {
  const limpio = sanitizarNombre(nombre);

  if (!limpio) {
    // 🎯 Aquí sabemos si fue por vacío o por peligroso
    if (nombre && tieneCaracteresPeligrosos(nombre)) {
      return {
        valido: false,
        error: `El ${campo} contiene caracteres no permitidos`,
      };
    }
    return { valido: false, error: `El ${campo} es obligatorio` };
  }

  if (limpio.length < 2)
    return { valido: false, error: `El ${campo} debe tener al menos 2 caracteres` };
  if (limpio.length > 100)
    return { valido: false, error: `El ${campo} no puede tener más de 100 caracteres` };

  return { valido: true, valor: limpio };
};

/**
 * 🆕 Valida nombre de cargo/departamento (más estricto)
 */
export const validarNombreEntidad = (nombre, campo = 'nombre') => {
  const limpio = sanitizarNombreEntidad(nombre);

  if (!limpio) {
    if (nombre && tieneCaracteresPeligrosos(nombre)) {
      return {
        valido: false,
        error: `El ${campo} contiene caracteres no permitidos (SQL/XSS)`,
      };
    }
    return { valido: false, error: `El ${campo} es obligatorio` };
  }

  if (limpio.length < 2)
    return { valido: false, error: `El ${campo} debe tener al menos 2 caracteres` };
  if (limpio.length > 100)
    return { valido: false, error: `El ${campo} no puede tener más de 100 caracteres` };

  // 🚫 No permitir que sea solo números
  if (/^\d+$/.test(limpio))
    return { valido: false, error: `El ${campo} no puede ser solo números` };

  return { valido: true, valor: limpio };
};

export const validarEmail = (email) => {
  if (!email) return { valido: true, valor: null };
  const limpio = sanitizarEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio))
    return { valido: false, error: 'Email inválido' };
  if (limpio.length > 100)
    return { valido: false, error: 'Email demasiado largo' };
  return { valido: true, valor: limpio };
};

export const validarTelefono = (telefono) => {
  if (!telefono) return { valido: true, valor: null };
  const limpio = sanitizarTelefono(telefono);
  if (limpio.length < 7)
    return { valido: false, error: 'Teléfono demasiado corto' };
  if (limpio.length > 20)
    return { valido: false, error: 'Máximo 20 caracteres' };
  return { valido: true, valor: limpio };
};

export const validarFecha = (fecha) => {
  if (!fecha) return { valido: true, valor: null };
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha))
    return { valido: false, error: 'Formato de fecha inválido' };
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return { valido: false, error: 'Fecha inválida' };
  return { valido: true, valor: fecha };
};

export const validarCargo = (cargo) => {
  return validarNombreEntidad(cargo, 'cargo');
};

export const validarDepartamento = (nombre) => {
  return validarNombreEntidad(nombre, 'departamento');
};

// =========================================================
// VALIDADOR GENERAL DE DTO EMPLEADO
// =========================================================
export const validarDtoEmpleado = (dto) => {
  const errores = {};
  const valores = {};

  const vCedula = validarCedula(dto.cedula);
  if (!vCedula.valido) errores.cedula = vCedula.error;
  else valores.cedula = vCedula.valor;

  const vNombre = validarNombre(dto.nombre, 'nombre');
  if (!vNombre.valido) errores.nombre = vNombre.error;
  else valores.nombre = vNombre.valor;

  const vApellido = validarNombre(dto.apellido, 'apellido');
  if (!vApellido.valido) errores.apellido = vApellido.error;
  else valores.apellido = vApellido.valor;

  const vEmail = validarEmail(dto.email);
  if (!vEmail.valido) errores.email = vEmail.error;
  else valores.email = vEmail.valor;

  const vTelefono = validarTelefono(dto.telefono);
  if (!vTelefono.valido) errores.telefono = vTelefono.error;
  else valores.telefono = vTelefono.valor;

  const vFecha = validarFecha(dto.fechaIngreso);
  if (!vFecha.valido) errores.fechaIngreso = vFecha.error;
  else valores.fechaIngreso = vFecha.valor;

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    valores,
  };
};