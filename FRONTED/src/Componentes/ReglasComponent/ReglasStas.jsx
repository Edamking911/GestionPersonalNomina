// src/Componentes/ReglasBiometricoComponent/ReglasStats.jsx
export default function ReglasStats({ reglas, loading }) {
  // ✅ Si está cargando, mostrar mensaje
  if (loading) {
    return (
      <div style={{ background: '#fff', padding: '40px', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#a0aec0' }}>
        Cargando configuración de reglas...
      </div>
    );
  }

  // ✅ Si no hay reglas (null o undefined), mostrar mensaje
  if (!reglas) {
    return (
      <div style={{ background: '#fff', padding: '40px', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#a0aec0' }}>
        No hay datos de configuración disponibles.
      </div>
    );
  }

  // ✅ Si hay datos, mostrarlos
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '18px 22px', borderRadius: '10px', minWidth: '200px', flex: 1 }}>
        <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Horarios Definidos</span>
        <p style={{ margin: '8px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#3182ce' }}>
          {reglas.horarios?.length || 0}
        </p>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '18px 22px', borderRadius: '10px', minWidth: '200px', flex: 1 }}>
        <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Empleados con Asignación</span>
        <p style={{ margin: '8px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#38a169' }}>
          {reglas.asignacionesActivas || 0}
        </p>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '18px 22px', borderRadius: '10px', minWidth: '200px', flex: 1 }}>
        <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Días Libres Fijos</span>
        <p style={{ margin: '8px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#dd6b20' }}>
          {reglas.diasLibresFijos?.length || 0}
        </p>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '18px 22px', borderRadius: '10px', minWidth: '200px', flex: 1 }}>
        <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Salidas Pendientes Hoy</span>
        <p style={{ margin: '8px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#e53e3e' }}>
          {reglas.salidasPendientes || 0}
        </p>
      </div>
    </div>
  );
}