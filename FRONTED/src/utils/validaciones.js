// src/utils/validaciones.js
// =========================================================
// VALIDACIONES ESTRICTAS ANTI-INYECCIÓN
// =========================================================
// Aunque el back usa TypeORM (queries parametrizadas), esta capa
// adicional previene que caracteres raros lleguen siquiera al back.
// =========================================================

// Patrones peligrosos (SQL injection, XSS, comandos)
const PATRONES_PELIGROSOS = [
  /('|--|;|\/\*|\*\/|xp_|sp_|exec|execute|drop|delete|insert|update|alter|create|truncate|select|union|script|javascript:|<script|onerror|onclick)/i,
  /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /[<>{}[\]\\]/,
];

/**
 * Detecta si un texto contiene patrones sospechosos
 */
export const tieneCaracteresPeligrosos = (texto) => {
  if (!texto || typeof texto !== 'string') return false;
  return PATRONES_PELIGROSOS.some((p) => p.test(texto));
};

/**
 * Sanitiza un texto: elimina caracteres peligrosos y normaliza espacios
 */
export const sanitizarTexto = (texto) => {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .trim()
    .replace(/\s+/g, ' ') // Colapsa espacios
    .replace(/[<>{}[\]\\]/g, '') // Quita < > { } [ ] \
    .replace(/['";]/g, '') // Quita comillas y ;
    .replace(/--/g, '') // Quita -- (comentario SQL)
    .replace(/\/\*|\*\//g, '') // Quita /* */
    .slice(0, 100); // Limita longitud
};

/**
 * Sanitiza un nombre/apellido: solo letras, espacios, acentos, apóstrofes y guiones
 */
export const sanitizarNombre = (texto) => {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'.-]/g, '') // Solo letras válidas
    .slice(0, 100);
};

/**
 * Sanitiza cédula: solo dígitos
 */
export const sanitizarCedula = (texto) => {
  if (!texto) return '';
  return String(texto).replace(/\D/g, '').slice(0, 10);
};

/**
 * Sanitiza teléfono: solo dígitos, +, -, (), espacios
 */
export const sanitizarTelefono = (texto) => {
  if (!texto) return '';
  return String(texto).replace(/[^\d+\-() ]/g, '').slice(0, 20);
};

/**
 * Sanitiza email: quita caracteres raros manteniendo estructura
 */
export const sanitizarEmail = (texto) => {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .trim()
    .toLowerCase()
    .replace(/[<>{}[\]\\;'"`]/g, '')
    .slice(0, 100);
};

// =========================================================
// VALIDADORES POR CAMPO
// =========================================================

export const validarCedula = (cedula) => {
  const limpia = sanitizarCedula(cedula);
  if (!limpia) return { valido: false, error: 'La cédula es obligatoria' };
  if (limpia.length < 6 || limpia.length > 10)
    return { valido: false, error: 'La cédula debe tener entre 6 y 10 dígitos' };
  if (/^0+$/.test(limpia))
    return { valido: false, error: 'Cédula inválida' };
  return { valido: true, valor: limpia };
};

export const validarNombre = (nombre, campo = 'nombre') => {
  const limpio = sanitizarNombre(nombre);
  if (!limpio)
    return { valido: false, error: `El ${campo} es obligatorio` };
  if (limpio.length < 2)
    return { valido: false, error: `El ${campo} debe tener al menos 2 caracteres` };
  if (limpio.length > 100)
    return { valido: false, error: `El ${campo} no puede tener más de 100 caracteres` };
  if (tieneCaracteresPeligrosos(limpio))
    return { valido: false, error: `El ${campo} contiene caracteres no permitidos` };
  return { valido: true, valor: limpio };
};

export const validarEmail = (email) => {
  if (!email) return { valido: true, valor: null }; // opcional
  const limpio = sanitizarEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio))
    return { valido: false, error: 'Email inválido' };
  if (limpio.length > 100)
    return { valido: false, error: 'Email demasiado largo' };
  return { valido: true, valor: limpio };
};

export const validarTelefono = (telefono) => {
  if (!telefono) return { valido: true, valor: null }; // opcional
  const limpio = sanitizarTelefono(telefono);
  if (limpio.length < 7)
    return { valido: false, error: 'Teléfono demasiado corto' };
  if (limpio.length > 20)
    return { valido: false, error: 'Máximo 20 caracteres' };
  return { valido: true, valor: limpio };
};

export const validarFecha = (fecha) => {
  if (!fecha) return { valido: true, valor: null }; // opcional
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha))
    return { valido: false, error: 'Formato de fecha inválido' };
  const d = new Date(fecha);
  if (isNaN(d.getTime()))
    return { valido: false, error: 'Fecha inválida' };
  return { valido: true, valor: fecha };
};

export const validarCargo = (cargo) => {
  const limpio = sanitizarTexto(cargo);
  if (!limpio) return { valido: false, error: 'El cargo es obligatorio' };
  if (limpio.length < 2)
    return { valido: false, error: 'El cargo debe tener al menos 2 caracteres' };
  if (tieneCaracteresPeligrosos(limpio))
    return { valido: false, error: 'El cargo contiene caracteres no permitidos' };
  return { valido: true, valor: limpio };
};

// =========================================================
//VALIDADOR GENERAL DE DTO
// =========================================================
export const validarDtoEmpleado = (dto) => {
  const errores = {};
  const valores = {};

  // Cédula
  const vCedula = validarCedula(dto.cedula);
  if (!vCedula.valido) errores.cedula = vCedula.error;
  else valores.cedula = vCedula.valor;

  // Nombre
  const vNombre = validarNombre(dto.nombre, 'nombre');
  if (!vNombre.valido) errores.nombre = vNombre.error;
  else valores.nombre = vNombre.valor;

  // Apellido
  const vApellido = validarNombre(dto.apellido, 'apellido');
  if (!vApellido.valido) errores.apellido = vApellido.error;
  else valores.apellido = vApellido.valor;

  // Email (opcional)
  const vEmail = validarEmail(dto.email);
  if (!vEmail.valido) errores.email = vEmail.error;
  else valores.email = vEmail.valor;

  // Teléfono (opcional)
  const vTelefono = validarTelefono(dto.telefono);
  if (!vTelefono.valido) errores.telefono = vTelefono.error;
  else valores.telefono = vTelefono.valor;

  // Fecha (opcional)
  const vFecha = validarFecha(dto.fechaIngreso);
  if (!vFecha.valido) errores.fechaIngreso = vFecha.error;
  else valores.fechaIngreso = vFecha.valor;

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    valores,
  };
};