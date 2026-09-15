// src/Componentes/UI/TableSkeleton.jsx

/**
 * 🦴 Skeleton de tabla
 *
 * Muestra filas grises animadas mientras carga una tabla.
 *
 * @param {number} columns - Cantidad de columnas (default: 8)
 * @param {number} rows    - Cantidad de filas a mostrar (default: 10)
 * @param {boolean} hasHeader - Mostrar barra de header (default: true)
 * @param {string} height  - Altura de cada fila (default: '42px')
 */
export default function TableSkeleton({
  columns = 8,
  rows = 10,
  hasHeader = true,
  height = '42px',
}) {
  return (
    <>
      <style>{`
        @keyframes tsShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ts-skeleton {
          background: linear-gradient(
            90deg,
            var(--skeleton-base) 0%,
            var(--skeleton-shine) 50%,
            var(--skeleton-base) 100%
          );
          background-size: 200% 100%;
          animation: tsShimmer 1.5s ease-in-out infinite;
          border-radius: 6px;
          height: 12px;
          width: 100%;
        }
        .ts-cell {
          padding: 12px 14px;
          display: flex;
          align-items: center;
        }
        .ts-row {
          display: grid;
          border-bottom: 1px solid var(--table-row-border);
        }
        .ts-header {
          background: var(--table-header-bg);
          border-bottom: 2px solid var(--table-header-border);
        }
      `}</style>

      <div
        style={{
          borderRadius: '10px',
          border: '1px solid var(--table-row-border)',
          overflow: 'hidden',
          background: 'var(--table-row-bg)',
        }}
      >
        {/* HEADER */}
        {hasHeader && (
          <div
            className="ts-row ts-header"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="ts-cell" style={{ height: '40px' }}>
                <div className="ts-skeleton" style={{ width: '70%' }} />
              </div>
            ))}
          </div>
        )}

        {/* FILAS */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="ts-row"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              background:
                rowIdx % 2 === 0
                  ? 'var(--table-row-bg)'
                  : 'var(--table-row-bg-alt)',
              height,
            }}
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div key={colIdx} className="ts-cell">
                <div
                  className="ts-skeleton"
                  style={{
                    // Ancho variable para que se vea más orgánico
                    width: colIdx === 0 ? '60%' : colIdx === 1 ? '85%' : '75%',
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}