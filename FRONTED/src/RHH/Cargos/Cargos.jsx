// src/RRH/Cargos/Cargos.jsx
import { useEffect, useState } from 'react';
import { useCargos } from '../../Hoosk/hooks-cargos';
import { useDepartamentos } from '../../Hoosk/hooks-departamentos';
import { useToast } from '../../Hoosk/hoosk';
import Toast from '../../Componentes/UI/Toast';
import Card from '../../Componentes/UI/Card';
import CargosTabla from './CargosComponentes/CargosTabla';
import CrearCargoModal from './CargosComponentes/CrearCargoModal';
import EditarCargoModal from './CargosComponentes/EditarCargoModal';

export default function Cargos() {
  const {
    cargos,
    loading,
    mensaje,
    setMensaje,
    listarCargos,
    crearCargo,
    actualizarCargo,
    eliminarCargo,
  } = useCargos();

  const { departamentos, listarDepartamentos } = useDepartamentos();
  const { toast, showToast, clearToast } = useToast();

  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [cargoSeleccionado, setCargoSeleccionado] = useState(null);

  // 🚀 Carga inicial
  useEffect(() => {
    listarCargos().catch(() => {});
    listarDepartamentos().catch(() => {});
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

  // ========== HANDLERS ==========
  const handleCrear = () => {
    setCargoSeleccionado(null);
    setModalCrearOpen(true);
  };

  const handleEditar = (cargo) => {
    setCargoSeleccionado(cargo);
    setModalEditarOpen(true);
  };

  const handleEliminar = async (cargo) => {
    if (
      !window.confirm(
        `¿Eliminar el cargo "${cargo.nombre}"?\n\nEsta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      await eliminarCargo(cargo.nombre);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGuardarCreacion = async (nombreDepartamento, dto) => {
    try {
      await crearCargo(nombreDepartamento, dto);
      setModalCrearOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGuardarEdicion = async (dto) => {
    try {
      await actualizarCargo(dto);
      setModalEditarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ========== STATS ==========
  const totalCargos = cargos.length;
  const totalConSueldo = cargos.filter(
    (c) => c.sueldo !== null && c.sueldo !== undefined && c.sueldo > 0,
  ).length;
  const sueldoPromedio =
    totalConSueldo > 0
      ? cargos.reduce(
          (sum, c) => sum + (Number(c.sueldo) || 0),
          0,
        ) / totalConSueldo
      : 0;

  return (
    <div
      className="content-padding-mobile"
      style={{
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'var(--text-primary)',
        background: 'var(--bg-app)',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @keyframes cargosEntrada {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .cargos-titulo {
          margin: 0 0 20px 0;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          animation: cargosEntrada 0.5s ease-out;
        }
        @media (max-width: 768px) {
          .cargos-titulo {
            font-size: 20px !important;
          }
          .cargos-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <h2 className="cargos-titulo">
        <span style={{ fontSize: '26px' }}>💼</span>
        <span>Gestión de Cargos</span>
      </h2>

      {/* ============ STATS ============ */}
      <div
        className="cargos-stats"
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
            💼 Total Cargos
          </span>
          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: '26px',
              fontWeight: 'bold',
              color: 'var(--card-info-title)',
            }}
          >
            {totalCargos}
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
            💰 Con Sueldo
          </span>
          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: '26px',
              fontWeight: 'bold',
              color: 'var(--card-success-title)',
            }}
          >
            {totalConSueldo}
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
            📊 Sueldo Promedio
          </span>
          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: '22px',
              fontWeight: 'bold',
              color: 'var(--card-warning-title)',
            }}
          >
            ${sueldoPromedio.toFixed(2)}
          </p>
        </Card>

        <Card variant="default" padding="sm">
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontWeight: '700',
              letterSpacing: '0.5px',
            }}
          >
            🏢 Departamentos
          </span>
          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: '26px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
            }}
          >
            {departamentos.length}
          </p>
        </Card>
      </div>

      {/* ============ TABLA ============ */}
      <CargosTabla
        cargos={cargos}
        loading={loading}
        onCrear={handleCrear}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />

      {/* ============ MODALES ============ */}
      <CrearCargoModal
        isOpen={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        onGuardar={handleGuardarCreacion}
        departamentos={departamentos}
      />

      <EditarCargoModal
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        cargo={cargoSeleccionado}
        onGuardar={handleGuardarEdicion}
        departamentos={departamentos}
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