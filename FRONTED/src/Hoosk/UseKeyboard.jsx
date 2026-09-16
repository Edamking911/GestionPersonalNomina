// src/hooks/useKeyboardShortcuts.js
import { useEffect, useRef } from 'react';

/**
 * ⌨Hook para registrar atajos de teclado globales.
 *
 * @param {Object} shortcuts - Mapa de atajos: { 'ctrl+k': fn, 'ctrl+shift+p': fn }
 * @param {Object} [opts]
 * @param {boolean} [opts.enabled=true] - Activar/desactivar todos los atajos
 * @param {boolean} [opts.preventDefault=true] - Hacer preventDefault al matchear
 *
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+k': () => setBuscar(true),
 *   'ctrl+b': () => irABiometrico(),
 * });
 */
export function useKeyboardShortcuts(shortcuts = {}, opts = {}) {
  const { enabled = true, preventDefault = true } = opts;

  // Guardar referencia estable a los shortcuts
  const shortcutsRef = useRef(shortcuts);
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Ignorar si el usuario está escribiendo en un input/textarea/contenteditable
      const target = e.target;
      const tag = target?.tagName?.toLowerCase();
      const isEditing =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable;

      // Normalizar la tecla
      const key = e.key?.toLowerCase();

      //  Construir el combo: "ctrl+shift+k", "escape", "f1", etc.
      const parts = [];
      if (e.ctrlKey) parts.push('ctrl');
      if (e.metaKey) parts.push('meta');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');

      // La tecla principal va al final
      let mainKey = key;
      // Normalizar teclas especiales
      if (key === ' ') mainKey = 'space';
      if (key === '/') mainKey = '/';
      if (key === '?') mainKey = '?';

      // Si la tecla es '/' pero viene con shift, en realidad es '?'
      // Lo dejamos como '/' porque ya está el modificador shift
      parts.push(mainKey);
      const combo = parts.join('+');

      // Buscar el atajo
      const handler = shortcutsRef.current[combo];

      // Escape SIEMPRE funciona aunque estés editando (para cerrar modales)
      const isEscape = key === 'escape';

      if (handler && (!isEditing || isEscape)) {
        if (preventDefault) e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, preventDefault]);
}

/**
 * Helper: formatea un atajo para mostrarlo al usuario
 * Ej: 'ctrl+k' → '⌘K' (Mac) o 'Ctrl+K' (otros)
 */
export function formatShortcut(combo) {
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  return combo
    .split('+')
    .map((part) => {
      const p = part.trim().toLowerCase();
      if (p === 'ctrl') return isMac ? '⌘' : 'Ctrl';
      if (p === 'meta') return '⌘';
      if (p === 'alt') return isMac ? '⌥' : 'Alt';
      if (p === 'shift') return '⇧';
      if (p === 'escape') return 'Esc';
      if (p === 'space') return 'Espacio';
      if (p === 'enter') return 'Enter';
      return p.toUpperCase();
    })
    .join(isMac ? '' : ' + ');
}