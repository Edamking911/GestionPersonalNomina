// src/Componentes/BiometricoComponent/TabsNav.jsx
const tabs = [
  { id: 'usuarios', label: '👥 Control de Asistencia de Hoy' },
  { id: 'todos', label: '📋 Todos los Registrados' },
  { id: 'marcajes', label: '📊 Historial por Fechas' },
  { id: 'fechaEspecifica', label: '📅 Buscar por Día Exacto' },
  { id: 'eventos', label: '🔍 Buscar por Cédula' }
];

export default function TabsNav({ activeTab, onTabChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px', margin: '25px 0 15px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)} // ✅ Usamos la prop
          style={{
            padding: '10px 18px',
            cursor: 'pointer',
            background: activeTab === tab.id ? '#3182ce' : '#fff',
            color: activeTab === tab.id ? '#fff' : '#4a5568',
            border: activeTab === tab.id ? '1px solid #3182ce' : '1px solid #cbd5e0',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === tab.id ? '0 2px 4px rgba(49, 130, 206, 0.2)' : 'none'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}