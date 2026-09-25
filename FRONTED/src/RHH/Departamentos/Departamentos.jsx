// src/RRH/Departamentos/Departamentos.jsx
import { useEffect, useState } from 'react';
import { useDepartamentos } from '../../Hoosk/hooks-departamentos';
import { useToast } from '../../Hoosk/hoosk';
import Toast from '../../Componentes/UI/Toast';
import Card from '../../Componentes/UI/Card';
import DepartamentosTabla from './DepartamentosComponentes/DepartamentosTabla';
import CrearDepartamentoModal from './DepartamentosComponentes/CrearDepartamentoModal';
import EditarDepartamentoModal from './DepartamentosComponentes/EditarDepartamentoModal';

export default function Departamentos() {
  const {
    departamentos,
    loading,
    mensaje,
    setMensaje,
    listarDepartamentos,
    crearDepartamento,
    actualizarDepartamento,
    eliminarDepartamento,
  } = useDepartamentos();

  const { toast, showToast, clearToast } = useToast();

  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [depSeleccionado, setDepSeleccionado] = useState(null);

  useEffect(() => {
    listarDepartamentos().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCrear = () => {
    setDepSeleccionado(null);
    setModalCrearOpen(true);
  };

  const handleEditar = (dep) => {
    setDepSeleccionado(dep);
    setModalEditarOpen(true);
  };

  const handleEliminar = async (dep) => {
    if (
      !window.confirm(
        `¿Eliminar el departamento "${dep.nombre}"?\n\nEsta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      await eliminarDepartamento(dep.nombre);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGuardarCreacion = async (dto) => {
    try {
      await crearDepartamento(dto);
      setModalCrearOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGuardarEdicion = async (nombreOriginal, dto) => {
    try {
      await actualizarDepartamento(nombreOriginal, dto);
      setModalEditarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

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
        @keyframes depEntrada {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .dep-titulo {
          margin: 0 0 20px 0;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          animation: depEntrada 0.5s ease-out;
        }
        @media (max-width: 768px) {
          .dep-titulo {
            font-size: 20px !important;
          }
          .dep-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <h2 className="dep-titulo">
        <span style={{ fontSize: '26px' }}>🏢</span>
        <span>Gestión de Departamentos</span>
      </h2>

      <div
        className="dep-stats"
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
            🏢 Total Departamentos
          </span>
          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: '26px',
              fontWeight: 'bold',
              color: 'var(--card-info-title)',
            }}
          >
            {departamentos.length}
          </p>
        </Card>
      </div>

      <DepartamentosTabla
        departamentos={departamentos}
        loading={loading}
        onCrear={handleCrear}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />

      <CrearDepartamentoModal
        isOpen={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        onGuardar={handleGuardarCreacion}
      />

      <EditarDepartamentoModal
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        departamento={depSeleccionado}
        onGuardar={handleGuardarEdicion}
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