// src/Componentes/BiometricoComponent/TabsNav.jsx

const tabs = [
  { id: 'usuarios', label: '👥 Control de Asistencia' },
  { id: 'todos', label: '📋 Todos los Registrados' },
  { id: 'marcajes', label: '📊 Historial por Fechas' },
  { id: 'fechaEspecifica', label: '📅 Buscar por Día' },
  { id: 'eventos', label: '🔍 Buscar por Cédula' },
];

export default function TabsNav({ activeTab, onTabChange }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        margin: '25px 0 15px 0',
        borderBottom: '1px solid var(--border-light)',
        paddingBottom: '12px',
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '10px 18px',
              cursor: 'pointer',
              background: isActive
                ? 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)'
                : 'var(--bg-card)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              border: isActive
                ? '1px solid #3182ce'
                : '1px solid var(--border-color)',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive
                ? '0 4px 12px rgba(49, 130, 206, 0.35)'
                : 'var(--shadow-sm)',
              fontFamily: 'inherit',
              position: 'relative',
              transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              if (isActive) return;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.boxShadow =
                '0 4px 10px rgba(49, 130, 206, 0.15)';
            }}
            onMouseLeave={(e) => {
              if (isActive) return;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}