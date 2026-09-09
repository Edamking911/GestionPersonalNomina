// src/ReglasBiometrico/ReglasBiometrico.jsx
import { useReglasBiometrico } from './hooks-reglas-biometrico';
import ReglasStats from '../Componentes/ReglasComponent/ReglasStas';
import AsignacionesList from '../Componentes/ReglasComponent/AsignacionesList';
import AsignarHorario from '../Componentes/ReglasComponent/AsignarHorario';
import DiasLibresConfig from '../Componentes/ReglasComponent/DiasLibresConfig';
import ValidarSalidas from '../Componentes/ReglasComponent/ValidarSalidas';
import EvaluarEmpleado from '../Componentes/ReglasComponent/EvaluarEmpleado';
import ReporteDiario from '../Componentes/ReglasComponent/ReporteDiarios';
import { useState, useEffect } from 'react'; // ✅ Agregamos useEffect

export default function ReglasBiometrico() {
  const {
    loading,
    mensaje,
    setMensaje,
    reglas,
    asignaciones,
    diasLibres,
    reporte,
    evaluacion,
    validacion,
    obtenerReglas,
    obtenerAsignaciones,
    obtenerDiasLibres,
    asignarHorario,
    asignarDiasLibresSemana,
    validarSalidas,
    evaluarEmpleado,
    limpiarEvaluacion, // 👈 extraemos la función
    obtenerReporte,
  } = useReglasBiometrico();

  const [vistaActiva, setVistaActiva] = useState('dashboard');

  useEffect(() => {
    obtenerReglas();
    obtenerAsignaciones();
    obtenerDiasLibres();
  }, []);

  const tabs = [
    { id: 'dashboard', label: '📊 Resumen' },
    { id: 'asignaciones', label: '📅 Asignaciones' },
    { id: 'asignar', label: '➕ Asignar Horario' },
    { id: 'dias-libres', label: '🗓️ Días Libres' },
    { id: 'validar', label: '✅ Validar Salidas' },
    { id: 'evaluar', label: '🔍 Evaluar Empleado' },
    { id: 'reporte', label: '📄 Reporte Diario' },
  ];

  const renderVista = () => {
    switch (vistaActiva) {
      case 'dashboard':
        return <ReglasStats reglas={reglas} asignaciones={asignaciones} diasLibres={diasLibres} />;
      case 'asignaciones':
        return <AsignacionesList asignaciones={asignaciones} onRefresh={() => obtenerAsignaciones()} />;
      case 'asignar':
        return <AsignarHorario onAsignar={asignarHorario} />;
      case 'dias-libres':
        return <DiasLibresConfig diasLibres={diasLibres} onRefresh={obtenerDiasLibres} onAsignar={asignarDiasLibresSemana} />;
      case 'validar':
        return <ValidarSalidas onValidar={validarSalidas} resultado={validacion} />;
      case 'evaluar':
        return (
          <EvaluarEmpleado
            onEvaluar={evaluarEmpleado}
            evaluacion={evaluacion}
            onLimpiar={limpiarEvaluacion} // 👈 pasamos la función
          />
        );
      case 'reporte':
        return <ReporteDiario onGenerar={obtenerReporte} reporte={reporte} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif', color: '#2c3e50', background: '#f8f9fa', minHeight: '100vh' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
        ⚙️ Reglas Biométricas
      </h2>

      {mensaje && (
        <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', padding: '12px 18px', margin: '15px 0', borderRadius: '8px', fontSize: '14px', color: '#2b6cb0', fontWeight: '500' }}>
          {mensaje}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', margin: '25px 0 15px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setVistaActiva(tab.id)}
            style={{
              padding: '10px 18px',
              cursor: 'pointer',
              background: vistaActiva === tab.id ? '#3182ce' : '#fff',
              color: vistaActiva === tab.id ? '#fff' : '#4a5568',
              border: vistaActiva === tab.id ? '1px solid #3182ce' : '1px solid #cbd5e0',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderVista()}
    </div>
  );
}