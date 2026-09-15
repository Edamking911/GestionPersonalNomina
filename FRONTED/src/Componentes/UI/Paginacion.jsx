// src/Componentes/UI/Pagination.jsx
import { useState, useEffect } from 'react';

// 🎨 Íconos SVG
const IconoPrimera = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="11 17 6 12 11 7" />
    <polyline points="18 17 13 12 18 7" />
  </svg>
);

const IconoAnterior = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconoSiguiente = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconoUltima = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 17 18 12 13 7" />
    <polyline points="6 17 11 12 6 7" />
  </svg>
);

export default function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  pages,
  pageSizeOptions = [10, 25, 50, 100, 250, 500],
  goToPage,
  nextPage,
  prevPage,
  firstPage,
  lastPage,
  changePageSize,
}) {
  const [inputPage, setInputPage] = useState(String(page));

  // 🔄 Mantener el input sincronizado con la página actual
  useEffect(() => {
    setInputPage(String(page));
  }, [page]);

  const handleGoToPage = () => {
    const n = parseInt(inputPage, 10);
    if (!isNaN(n)) {
      goToPage(n);
    } else {
      setInputPage(String(page));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGoToPage();
    }
    if (e.key === 'Escape') {
      setInputPage(String(page));
      e.target.blur();
    }
  };

  // No hay datos
  if (totalItems === 0) {
    return (
      <div
        style={{
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-light)',
        }}
      >
        No hay registros para mostrar
      </div>
    );
  }

  // Formatear número con separador de miles
  const formatNumber = (n) => n.toLocaleString('es-VE');

  return (
    <>
      <style>{`
        .pgn-wrapper {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 20px;
          border-top: 1px solid var(--border-light);
          background: var(--bg-hover);
          font-size: 13px;
        }

        .pgn-info {
          color: var(--text-secondary);
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pgn-info strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        .pgn-pagesize {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pgn-select {
          padding: 4px 8px;
          border: 1px solid var(--input-border);
          border-radius: 6px;
          background: var(--input-bg);
          color: var(--input-text);
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          outline: none;
        }
        .pgn-select:focus {
          border-color: var(--input-border-focus);
        }

        .pgn-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pgn-btn {
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-secondary);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-family: inherit;
          font-weight: 600;
          transition: all 0.15s ease;
        }
        .pgn-btn:hover:not(:disabled) {
          background: var(--primary-soft);
          color: var(--primary);
          border-color: var(--primary);
        }
        .pgn-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pgn-btn.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }
        .pgn-btn.active:hover {
          background: var(--primary-hover);
        }

        .pgn-dots {
          min-width: 24px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-weight: 700;
          user-select: none;
        }

        .pgn-goto {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 12px;
        }
        .pgn-input {
          width: 56px;
          height: 32px;
          padding: 0 8px;
          border: 1px solid var(--input-border);
          border-radius: 6px;
          background: var(--input-bg);
          color: var(--input-text);
          font-size: 12px;
          font-family: inherit;
          text-align: center;
          outline: none;
        }
        .pgn-input:focus {
          border-color: var(--input-border-focus);
          box-shadow: 0 0 0 3px var(--input-focus-shadow);
        }

        /* 📱 Responsive */
        @media (max-width: 768px) {
          .pgn-wrapper {
            flex-direction: column;
            align-items: stretch;
          }
          .pgn-nav {
            justify-content: center;
            flex-wrap: wrap;
          }
          .pgn-pagesize,
          .pgn-goto,
          .pgn-info {
            justify-content: center;
          }
        }
      `}</style>

      <div className="pgn-wrapper">
        {/* 📊 INFO: "Mostrando 1-25 de 1.247" */}
        <div className="pgn-info">
          <span>
            Mostrando <strong>{formatNumber(startIndex + 1)}</strong>–
            <strong>{formatNumber(endIndex)}</strong> de{' '}
            <strong>{formatNumber(totalItems)}</strong>{' '}
            {totalItems === 1 ? 'registro' : 'registros'}
          </span>

          <div className="pgn-pagesize">
            <span>·</span>
            <select
              className="pgn-select"
              value={pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} por página
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 🎯 NAVEGACIÓN */}
        <div className="pgn-nav">
          <button
            className="pgn-btn"
            onClick={firstPage}
            disabled={page === 1}
            title="Primera página"
          >
            <IconoPrimera />
          </button>

          <button
            className="pgn-btn"
            onClick={prevPage}
            disabled={page === 1}
            title="Anterior"
          >
            <IconoAnterior />
          </button>

          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`dots-${idx}`} className="pgn-dots">
                …
              </span>
            ) : (
              <button
                key={p}
                className={`pgn-btn ${p === page ? 'active' : ''}`}
                onClick={() => goToPage(p)}
              >
                {p}
              </button>
            ),
          )}

          <button
            className="pgn-btn"
            onClick={nextPage}
            disabled={page === totalPages}
            title="Siguiente"
          >
            <IconoSiguiente />
          </button>

          <button
            className="pgn-btn"
            onClick={lastPage}
            disabled={page === totalPages}
            title="Última página"
          >
            <IconoUltima />
          </button>
        </div>

        {/* 🔢 IR A PÁGINA */}
        <div className="pgn-goto">
          <span>Ir a:</span>
          <input
            type="text"
            className="pgn-input"
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            onBlur={handleGoToPage}
          />
          <span>de {totalPages}</span>
        </div>
      </div>
    </>
  );
}