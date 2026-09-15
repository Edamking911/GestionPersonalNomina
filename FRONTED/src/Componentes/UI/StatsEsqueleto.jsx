// src/Componentes/UI/StatsSkeleton.jsx

/**
 * 🦴 Skeleton de fila de stats
 *
 * Muestra N tarjetas grises animadas para la fila de stats
 * (Días trabajados, Ausencias, Horas Extra, etc.)
 *
 * @param {number} count - Cantidad de tarjetas (default: 4)
 */
export default function StatsSkeleton({ count = 4 }) {
  return (
    <>
      <style>{`
        @keyframes ssShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ss-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          padding: 14px 16px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ss-line {
          background: linear-gradient(
            90deg,
            var(--skeleton-base) 0%,
            var(--skeleton-shine) 50%,
            var(--skeleton-base) 100%
          );
          background-size: 200% 100%;
          animation: ssShimmer 1.5s ease-in-out infinite;
          border-radius: 6px;
        }
      `}</style>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`,
          gap: '12px',
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="ss-card">
            {/* Label */}
            <div
              className="ss-line"
              style={{ width: '65%', height: '10px' }}
            />
            {/* Valor */}
            <div
              className="ss-line"
              style={{ width: '40%', height: '22px' }}
            />
          </div>
        ))}
      </div>
    </>
  );
}