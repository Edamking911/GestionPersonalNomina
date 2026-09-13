// src/ReglasBiometrico/ReglasBiometrico.jsx
import { useReglasBiometrico } from '../Hoosk/hooks-reglas-biometrico';
import {useToast} from '../Hoosk/hoosk'
import Toast from '../Componentes/UI/Toast';
import ReglasStats from '../Componentes/ReglasComponent/ReglasStas';
import AsignacionesList from '../Componentes/ReglasComponent/AsignacionesList';
import AsignarHorario from '../Componentes/ReglasComponent/AsignarHorario';
import DiasLibresConfig from '../Componentes/ReglasComponent/DiasLibresConfig';
import ValidarSalidas from '../Componentes/ReglasComponent/ValidarSalidas';
import EvaluarEmpleado from '../Componentes/ReglasComponent/EvaluarEmpleado';
import ReporteDiario from '../Componentes/ReglasComponent/ReporteDiarios';
import ReporteSemanal from '../Componentes/ReglasComponent/ReporteSemanal';    
import ReporteMensual from '../Componentes/ReglasComponent/ReporteMensual';    
import ImportarExcel from '../Componentes/ReglasComponent/ImportarExcel';  
import Dashboard from '../Componentes/ReglasComponent/Dashboard';
import { useState, useEffect, useRef } from 'react';

export default function ReglasBiometrico() {
  const {
    loading,
    mensaje,
    setMensaje,
    reglas,
    asignaciones,
    diasLibres,
    reporte,
    reporteSemanal,
    reporteMensual,
    evaluacion,
    validacion,
    previewExcel,
    resultadoImportacion,
    backups,
    obtenerReglas,
    obtenerAsignaciones,
    obtenerDiasLibres,
    asignarHorario,
    asignarDiasLibresSemana,
    validarSalidas,
    evaluarEmpleado,
    limpiarEvaluacion,
    obtenerReporte,
    obtenerReporteSemanal,
    obtenerReporteMensual,
    descargarPlantilla,
    validarExcel,
    importarExcel,
    listarBackups,
    restaurarBackup,
    restaurarUltimoBackup,
    limpiarBackups,
    limpiarPreview,
  } = useReglasBiometrico();

  const { toast, showToast, clearToast } = useToast();

  const lastMsgRef = useRef({ texto: '', timestamp: 0 });

  useEffect(() => {
    if (!mensaje) return;

    const ahora = Date.now();
    const ultimo = lastMsgRef.current;

    if (mensaje === ultimo.texto && ahora - ultimo.timestamp < 3000) {
      setMensaje('');
      return;
    }

    lastMsgRef.current = { texto: mensaje, timestamp: ahora };

    const timeoutId = setTimeout(() => {
      const msg = mensaje.toLowerCase();

      let tipo = 'info';

      if (
        msg.includes('error') ||
        msg.includes('no se pudo') ||
        msg.includes('no se pudieron') ||
        msg.includes('fall') ||
        msg.includes('desactivad') ||
        msg.includes('no existe') ||
        msg.includes('no está activo')
      ) {
        tipo = 'error';
      } else if (
        msg.includes('completa') ||
        msg.includes('debes') ||
        msg.includes('selecciona') ||
        msg.includes('atención') ||
        msg.includes('⚠️')
      ) {
        tipo = 'warning';
      } else if (
        msg.includes('éxito') ||
        msg.includes('correctamente') ||
        msg.includes('completada') ||
        msg.includes('cargad') ||
        msg.includes('activado') ||
        msg.includes('desactivado') ||
        msg.includes('generad') ||
        msg.includes('importad') ||
        msg.includes('restaurad') ||
        msg.includes('asignad')
      ) {
        tipo = 'success';
      }

      showToast(mensaje, tipo);
      setMensaje('');
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [mensaje, showToast, setMensaje]);

  const [vistaActiva, setVistaActiva] = useState('dashboard');

  useEffect(() => {
    obtenerReglas();
    obtenerAsignaciones();
    obtenerDiasLibres();
  }, []);

  const tabs = [
    { id: 'dashboard', label: '📊 Resumen' },
    { id: 'graficos', label: '📈 Gráficos' },
    { id: 'asignaciones', label: '📅 Asignaciones' },
    { id: 'asignar', label: '➕ Asignar Horario' },
    { id: 'dias-libres', label: '🗓️ Días Libres' },
    { id: 'validar', label: '✅ Validar Salidas' },
    { id: 'evaluar', label: '🔍 Evaluar Empleado' },
    { id: 'reporte', label: '📄 Reporte Diario' },
    { id: 'reporte-semanal', label: '📊 Reporte Semanal' },
    { id: 'reporte-mensual', label: '💰 Reporte Mensual' },
    { id: 'importar-excel', label: '📤 Importar / Exportar Excel' },
  ];

  const renderVista = () => {
    switch (vistaActiva) {
      case 'dashboard':
        return (
          <ReglasStats
            reglas={reglas}
            asignaciones={asignaciones}
            diasLibres={diasLibres}
          />
        );

      case 'graficos':
        return (
          <Dashboard
            reporteSemanal={reporteSemanal}
            onGenerarSemanal={obtenerReporteSemanal}
          />
        );

      case 'asignaciones':
        return (
          <AsignacionesList
            asignaciones={asignaciones}
            onRefresh={(semana) => obtenerAsignaciones(semana)}
          />
        );

      case 'asignar':
        return <AsignarHorario onAsignar={asignarHorario} showToast={showToast} />;

      case 'dias-libres':
        return (
          <DiasLibresConfig
            diasLibres={diasLibres}
            onRefresh={obtenerDiasLibres}
            onAsignar={asignarDiasLibresSemana}
            showToast={showToast}
          />
        );

      case 'validar':
        return (
          <ValidarSalidas
            onValidar={validarSalidas}
            resultado={validacion}
            showToast={showToast}
          />
        );

      case 'evaluar':
        return (
          <EvaluarEmpleado
            onEvaluar={evaluarEmpleado}
            evaluacion={evaluacion}
            onLimpiar={limpiarEvaluacion}
            showToast={showToast}
          />
        );

      case 'reporte':
        return <ReporteDiario onGenerar={obtenerReporte} reporte={reporte} />;

      case 'reporte-semanal':
        return (
          <ReporteSemanal
            onGenerar={obtenerReporteSemanal}
            reporte={reporteSemanal}
          />
        );

      case 'reporte-mensual':
        return (
          <ReporteMensual
            onGenerar={obtenerReporteMensual}
            reporte={reporteMensual}
          />
        );

      case 'importar-excel':
        return (
          <ImportarExcel
            onDescargarPlantilla={descargarPlantilla}
            onValidar={validarExcel}
            onImportar={importarExcel}
            previewExcel={previewExcel}
            resultadoImportacion={resultadoImportacion}
            onLimpiarPreview={limpiarPreview}
            backups={backups}
            onListarBackups={listarBackups}
            onRestaurarBackup={restaurarBackup}
            onRestaurarUltimo={restaurarUltimoBackup}
            showToast={showToast}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'var(--text-primary)',
        background: 'var(--bg-app)',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @keyframes brilloRecorrido {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes girarEngranaje {
          0%, 100% {
            transform: rotate(0deg) scale(1);
            filter: drop-shadow(0 0 0px #805ad5);
          }
          50% {
            transform: rotate(180deg) scale(1.15);
            filter: drop-shadow(0 0 12px #805ad5);
          }
        }

        @keyframes entradaTitulo {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes entradaTab {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .titulo-reglas {
          margin: 0 0 20px 0;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(
            90deg,
            var(--text-primary) 0%,
            var(--text-primary) 40%,
            #805ad5 50%,
            var(--text-primary) 60%,
            var(--text-primary) 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: brilloRecorrido 4s linear infinite, entradaTitulo 0.6s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .titulo-reglas .engranaje {
          display: inline-block;
          font-size: 26px;
          -webkit-text-fill-color: initial;
          animation: girarEngranaje 3s ease-in-out infinite;
        }

        .reglas-tab {
          padding: 10px 18px;
          cursor: pointer;
          background: var(--reglas-tab-bg);
          color: var(--reglas-tab-text);
          border: 1px solid var(--reglas-tab-border);
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          animation: entradaTab 0.4s ease-out backwards;
          position: relative;
          overflow: hidden;
          font-family: inherit;
        }

        .reglas-tab:hover {
          transform: translateY(-2px);
          border-color: var(--reglas-tab-hover-border);
          color: var(--reglas-tab-hover-text);
          box-shadow: 0 4px 10px var(--reglas-tab-hover-shadow);
        }

        .reglas-tab.activa {
          background: linear-gradient(135deg, #805ad5 0%, #6b46c1 100%);
          color: #fff;
          border-color: #805ad5;
          box-shadow: 0 4px 12px rgba(128, 90, 213, 0.4);
        }

        .reglas-tab.activa:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(128, 90, 213, 0.5);
        }

        .reglas-tab:nth-child(1) { animation-delay: 0.0s; }
        .reglas-tab:nth-child(2) { animation-delay: 0.05s; }
        .reglas-tab:nth-child(3) { animation-delay: 0.10s; }
        .reglas-tab:nth-child(4) { animation-delay: 0.15s; }
        .reglas-tab:nth-child(5) { animation-delay: 0.20s; }
        .reglas-tab:nth-child(6) { animation-delay: 0.25s; }
        .reglas-tab:nth-child(7) { animation-delay: 0.30s; }
        .reglas-tab:nth-child(8) { animation-delay: 0.35s; }
        .reglas-tab:nth-child(9) { animation-delay: 0.40s; }
        .reglas-tab:nth-child(10) { animation-delay: 0.45s; }
        .reglas-tab:nth-child(11) { animation-delay: 0.50s; }
      `}</style>

      <h2 className="titulo-reglas">
        <span className="engranaje">⚙️</span>
        <span>Reglas Biométricas</span>
      </h2>

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
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setVistaActiva(tab.id)}
            className={`reglas-tab ${vistaActiva === tab.id ? 'activa' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderVista()}

      {toast.message && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          duration={6000}
          position="top-right"
          onClose={clearToast}
        />
      )}
    </div>
  );
}