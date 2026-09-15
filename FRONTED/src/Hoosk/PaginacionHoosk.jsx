// src/hooks/usePagination.js
import { useState, useMemo, useEffect } from 'react';

/**
 * 📄 Hook de paginación reutilizable.
 * Escalable para miles de registros.
 *
 * @param {Array} items - Array completo de datos
 * @param {Object} opts
 * @param {number} [opts.initialPageSize=25] - Filas por página inicial
 * @param {Array<number>} [opts.pageSizeOptions] - Opciones de filas por página
 * @param {Array} [opts.resetKeys=[]] - Cuando cambian estas keys, resetea a página 1
 *
 * @returns {Object} Todo lo necesario para renderizar la paginación
 */
export function usePagination(
  items = [],
  {
    initialPageSize = 25,
    pageSizeOptions = [10, 25, 50, 100, 250, 500],
    resetKeys = [],
  } = {},
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Total de páginas (siempre al menos 1)
  const totalItems = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // 🔄 Resetear a página 1 cuando cambian los filtros
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPage(1);
  }, resetKeys);

  // 🔄 Si la página actual queda fuera de rango (por filtros), ajustar
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // 📊 Rango visible
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // 📄 Datos de la página actual (memoizado para performance)
  const paginatedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  // 🎯 Funciones de navegación
  const goToPage = (n) => {
    const target = Math.max(1, Math.min(n, totalPages));
    setPage(target);
  };

  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);
  const firstPage = () => goToPage(1);
  const lastPage = () => goToPage(totalPages);

  // 🔢 Cambiar filas por página
  const changePageSize = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  // 🧮 Generar array de páginas con elipsis (estilo GitHub/Linear)
  // Ej: [1, '...', 45, 46, 47, 48, 49, '...', 200]
  const pages = useMemo(() => {
    const total = totalPages;
    const current = page;
    const delta = 2; // cuántas páginas mostrar a cada lado
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }, [totalPages, page]);

  return {
    // Estados
    page,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    pages,
    pageSizeOptions,

    // Datos paginados
    paginatedItems,

    // Funciones
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changePageSize,
  };
}