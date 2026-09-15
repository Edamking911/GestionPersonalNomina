// src/Componentes/UI/ChartSkeleton.jsx

/**
 * 🦴 Skeleton de gráfico
 *
 * Muestra un bloque grande gris animado que simula el área de un gráfico.
 * Incluye una barra de título arriba.
 *
 * @param {number} height - Altura del área del gráfico (default: 320)
 * @param {boolean} hasTitle - Mostrar barra de título (default: true)
 */
export default function ChartSkeleton({ height = 320, hasTitle = true }) {
  return (
    <>
      <style>{`
        @keyframes csShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .cs-container {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          padding: 20px;
          border-radius: 10px;
        }
        .cs-line {
          background: linear-gradient(
            90deg,
            var(--skeleton-base) 0%,
            var(--skeleton-shine) 50%,
            var(--skeleton-base) 100%
          );
          background-size: 200% 100%;
          animation: csShimmer 1.5s ease-in-out infinite;
          border-radius: 8px;
        }
        .cs-chart {
          background: linear-gradient(
            90deg,
            var(--skeleton-base) 0%,
            var(--skeleton-shine) 50%,
            var(--skeleton-base) 100%
          );
          background-size: 200% 100%;
          animation: csShimmer 1.5s ease-in-out infinite;
          border-radius: 8px;
          width: 100%;
        }
      `}</style>

      <div className="cs-container">
        {/* Título */}
        {hasTitle && (
          <div
            className="cs-line"
            style={{
              width: '50%',
              height: '20px',
              marginBottom: '16px',
            }}
          />
        )}

        {/* Área del gráfico */}
        <div className="cs-chart" style={{ height: `${height}px` }} />
      </div>
    </>
  );
}