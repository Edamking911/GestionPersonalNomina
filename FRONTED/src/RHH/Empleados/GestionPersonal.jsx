// src/GestionPersonal/GestionPersonal.jsx
import { useEffect, useState } from 'react';
import { useEmpleados } from '../Hoosk/hooks-empleados';
import { usePermisos } from '../Componentes/Context/PermisosContext';
import { useToast } from '../Hoosk/hoosk';
import Toast from '../Componentes/UI/Toast';
import Button from '../Componentes/UI/Button';
import Card from '../Componentes/UI/Card';
import EmpleadosTabla from '../Componentes/Empleados/EmpleadosTabla';
import VerEmpleadoModal from '../Componentes/Empleados/VerEmpleadoModal';
import EditarEmpleadoModal from '../Componentes/Empleados/EditarEmpleadoModal';
import CrearEmpleadoModal from '../Componentes/Empleados/CrearEmpleadoModal';
import ImportarEmpleadosExcelModal from '../Componentes/Empleados/ImportarEmpleadosExcelModal';
import { useEmpleadosExcel } from '../Hoosk/hooks-empleados-excel'; 

export default function GestionPersonal() {
  const {
    loading,
    mensaje,
    setMensaje,
    empleados,
    listarEmpleados,
    verEmpleado,
    actualizarEmpleado,
    desactivarEmpleado,
    eliminarEmpleado,
    crearEmpleado,
  } = useEmpleados();

  const {
    previewExcel,
    resultadoImportacion,
    descargarPlantilla,
    validarExcel,
    importarExcel,
    limpiarPreview,
  } = useEmpleadosExcel();

  const { toast, showToast, clearToast } = useToast();

  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalExcelOpen, setModalExcelOpen] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

  // 🚀 Carga inicial
  useEffect(() => {
    listarEmpleados().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔔 Mensaje → toast
  useEffect(() => {
    if (!mensaje) return;
    const timer = setTimeout(() => {
      const msg = mensaje.toLowerCase();
      let tipo = 'info';
      if (msg.includes('✅') || msg.includes('correctamente')) tipo = 'success';
      else if (msg.includes('error')) tipo = 'error';
      showToast(mensaje, tipo);
      setMensaje('');
    }, 200);
    return () => clearTimeout(timer);
  }, [mensaje, showToast, setMensaje]);

  // ========== HANDLERS CRUD ==========
  const handleVer = async (emp) => {
    try {
      const data = await verEmpleado(emp.cedula);
      setEmpleadoSeleccionado(data);
      setModalVerOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditar = async (emp) => {
    try {
      const data = await verEmpleado(emp.cedula);
      setEmpleadoSeleccionado(data);
      setModalEditarOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDesactivar = async (emp) => {
    const nombreCompleto = `${emp.nombre || ''} ${emp.apellido || ''}`.trim();
    if (
      !window.confirm(
        `¿Desactivar a ${nombreCompleto || emp.cedula}?\n\nEl empleado pasará a estado INACTIVO.`,
      )
    )
      return;

    try {
      await desactivarEmpleado(emp.cedula);
      setModalVerOpen(false);
    } catch (err) {
      console.error(err);
      window.alert(
        `❌ No se pudo desactivar:\n${
          err.response?.data?.message || err.message
        }`,
      );
    }
  };

  // 🔒 Eliminar BLOQUEADO — funcionalidad en desarrollo
  const handleEliminar = async (emp) => {
    window.alert(
      '🔒 Funcionalidad en desarrollo\n\nLa eliminación de empleados estará disponible próximamente.\n\nPor ahora puedes usar "Desactivar" para marcarlo como inactivo.',
    );
  };

  const handleGuardarEdicion = async (dto) => {
    try {
      await actualizarEmpleado(dto);
      setModalEditarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGuardarCreacion = async (nombreCargo, dto) => {
    try {
      await crearEmpleado(nombreCargo, dto);
      setModalCrearOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ========== HANDLERS EXCEL ==========
  const handleAbrirExcel = () => {
    limpiarPreview();
    setModalExcelOpen(true);
  };

  const handleImportarExcel = async (file) => {
    try {
      await importarExcel(file);
      await listarEmpleados();
    } catch (err) {
      console.error(err);
    }
  };

  // ========== STATS ==========
  const totalActivos = empleados.filter((e) => e.estado === 'ACTIVO').length;
  const totalInactivos = empleados.filter((e) => e.estado === 'INACTIVO').length;
  const totalSuspendidos = empleados.filter(
    (e) => e.estado === 'SUSPENDIDO',
  ).length;

  return (
    <div
      className="content-padding-mobile gp-container"
      style={{
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'var(--text-primary)',
        background: 'var(--bg-app)',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @keyframes gpEntrada {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .gp-titulo {
          margin: 0 0 20px 0;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          animation: gpEntrada 0.5s ease-out;
        }

        @media (max-width: 768px) {
          .gp-container {
            padding: 16px 12px !important;
          }
          .gp-titulo {
            font-size: 20px !important;
            margin-bottom: 16px !important;
          }
          .gp-titulo span:first-child {
            font-size: 22px !important;
          }
          .gp-stats {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .gp-stats .stat-card-value {
            font-size: 22px !important;
          }
        }
        @media (max-width: 400px) {
          .gp-stats {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <h2 className="gp-titulo">
        <span style={{ fontSize: '26px' }}>👥</span>
        <span>Gestión Personal</span>
      </h2>

      {/* ============ STATS ============ */}
      <div
        className="gp-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <Card variant="info" padding="sm">
          <span
            style={{
              fontSize: '11px',
              color: 'var(--card-info-title)',
              textTransform: 'uppercase',
              fontWeight: '700',
              letterSpacing: '0.5px',
            }}
          >
            👥 Total Empleados
          </span>
          <p
            className="stat-card-value"
            style={{
              margin: '6px 0 0 0',
              fontSize: '26px',
              fontWeight: 'bold',
              color: 'var(--card-info-title)',
            }}
          >
            {empleados.length}
          </p>
        </Card>

        <Card variant="success" padding="sm">
          <span
            style={{
              fontSize: '11px',
              color: 'var(--card-success-title)',
              textTransform: 'uppercase',
              fontWeight: '700',
              letterSpacing: '0.5px',
            }}
          >
            ✅ Activos
          </span>
          <p
            className="stat-card-value"
            style={{
              margin: '6px 0 0 0',
              fontSize: '26px',
              fontWeight: 'bold',
              color: 'var(--card-success-title)',
            }}
          >
            {totalActivos}
          </p>
        </Card>

        <Card variant="danger" padding="sm">
          <span
            style={{
              fontSize: '11px',
              color: 'var(--card-danger-title)',
              textTransform: 'uppercase',
              fontWeight: '700',
              letterSpacing: '0.5px',
            }}
          >
            🚫 Inactivos
          </span>
          <p
            className="stat-card-value"
            style={{
              margin: '6px 0 0 0',
              fontSize: '26px',
              fontWeight: 'bold',
              color: 'var(--card-danger-title)',
            }}
          >
            {totalInactivos}
          </p>
        </Card>

        <Card variant="warning" padding="sm">
          <span
            style={{
              fontSize: '11px',
              color: 'var(--card-warning-title)',
              textTransform: 'uppercase',
              fontWeight: '700',
              letterSpacing: '0.5px',
            }}
          >
            ⏸️ Suspendidos
          </span>
          <p
            className="stat-card-value"
            style={{
              margin: '6px 0 0 0',
              fontSize: '26px',
              fontWeight: 'bold',
              color: 'var(--card-warning-title)',
            }}
          >
            {totalSuspendidos}
          </p>
        </Card>
      </div>

      {/* ============ TABLA ============ */}
      <EmpleadosTabla
        empleados={empleados}
        loading={loading}
        onVer={handleVer}
        onEditar={handleEditar}
        onDesactivar={handleDesactivar}
        onEliminar={handleEliminar}
        onCrear={() => setModalCrearOpen(true)}
        onImportarExcel={handleAbrirExcel}
      />

      {/* ============ MODALES ============ */}
      <VerEmpleadoModal
        isOpen={modalVerOpen}
        onClose={() => setModalVerOpen(false)}
        empleado={empleadoSeleccionado}
        onEditar={() => {
          setModalVerOpen(false);
          setModalEditarOpen(true);
        }}
        onDesactivar={handleDesactivar}
        onEliminar={handleEliminar}
      />

      <EditarEmpleadoModal
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        empleado={empleadoSeleccionado}
        onGuardar={handleGuardarEdicion}
      />

      <CrearEmpleadoModal
        isOpen={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        onGuardar={handleGuardarCreacion}
      />

      <ImportarEmpleadosExcelModal
        isOpen={modalExcelOpen}
        onClose={() => setModalExcelOpen(false)}
        onDescargarPlantilla={descargarPlantilla}
        onValidar={validarExcel}
        onImportar={handleImportarExcel}
        previewExcel={previewExcel}
        resultadoImportacion={resultadoImportacion}
        onLimpiarPreview={limpiarPreview}
      />

      {toast.message && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          duration={5000}
          position="top-right"
          onClose={clearToast}
        />
      )}
    </div>
  );
}
