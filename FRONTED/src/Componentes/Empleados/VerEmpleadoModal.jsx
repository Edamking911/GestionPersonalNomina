// src/GestionPersonal/Componentes/VerEmpleadoModal.jsx
import Modal from '../../Componentes/UI/Modal';
import Button from '../../Componentes/UI/Button';
import Badge from '../../Componentes/UI/Badge';

// 🆕 Helper: maneja cargo como string O como objeto
const obtenerNombreCargo = (cargo) => {
  if (!cargo) return null;
  if (typeof cargo === 'string') return cargo;
  return cargo.nombre || null;
};

// 🆕 Helper: extrae el sueldo desde cargo.sueldo (con fallback a empleado.sueldo)
const obtenerSueldo = (empleado) => {
  if (!empleado) return null;
  // Prioridad 1: viene dentro del objeto cargo
  if (empleado.cargo && typeof empleado.cargo === 'object') {
    if (empleado.cargo.sueldo !== undefined && empleado.cargo.sueldo !== null) {
      return empleado.cargo.sueldo;
    }
  }
  // Prioridad 2: viene al nivel del empleado (por si el back cambia)
  return empleado.sueldo ?? null;
};

// 🆕 Formatear fecha a DD/MM/YYYY
const formatearFecha = (fecha) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '—';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${dd}/${m}/${y}`;
};

// 🆕 Formatear sueldo en USD
const formatearSueldo = (sueldo) => {
  if (sueldo === null || sueldo === undefined || sueldo === '') return null;

  const num = typeof sueldo === 'string' ? parseFloat(sueldo) : Number(sueldo);
  if (isNaN(num)) return null;

  const formateado = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `$${formateado}`;
};

// Row estilo limpio
const InfoRow = ({ icon, label, children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '12px 14px',
      background: 'var(--bg-hover)',
      border: '1px solid var(--border-light)',
      borderRadius: '10px',
    }}
  >
    <span style={{ fontSize: '20px', flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p
        style={{
          margin: 0,
          fontSize: '10px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          fontWeight: '700',
          letterSpacing: '0.4px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '2px 0 0 0',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          wordBreak: 'break-word',
        }}
      >
        {children}
      </p>
    </div>
  </div>
);

export default function VerEmpleadoModal({
  isOpen,
  onClose,
  empleado,
  onEditar,
  onDesactivar,
  onEliminar,
}) {
  if (!empleado) return null;

  const cargoNombre = obtenerNombreCargo(empleado.cargo);

  // 🆕 Sueldo — lee de empleado.cargo.sueldo (o fallback a empleado.sueldo)
  const sueldoFormateado = formatearSueldo(obtenerSueldo(empleado));

  const estadoMap = {
    ACTIVO: { variant: 'success', texto: 'Activo' },
    INACTIVO: { variant: 'danger', texto: 'Inactivo' },
    SUSPENDIDO: { variant: 'warning', texto: 'Suspendido' },
  };
  const estadoBadge = estadoMap[empleado.estado] || {
    variant: 'default',
    texto: empleado.estado,
  };

  const footer = (
    <>
      <Button variant="ghost" size="md" onClick={onClose}>
        Cerrar
      </Button>

      {empleado.estado === 'ACTIVO' && (
        <Button
          variant="dark"
          size="md"
          onClick={() => onDesactivar(empleado)}
          iconLeft="🚫"
        >
          Desactivar
        </Button>
      )}

      <Button
        variant="danger"
        size="md"
        onClick={() => onEliminar(empleado)}
        iconLeft="🗑️"
      >
        Eliminar
      </Button>

      <Button
        variant="warning"
        size="md"
        onClick={onEditar}
        iconLeft="✏️"
      >
        Editar
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Empleado"
      subtitle={`Cédula ${empleado.cedula}`}
      icon="👤"
      variant="info"
      size="md"
      footer={footer}
    >
      <style>{`
        @media (max-width: 600px) {
          .ver-emp-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Badges arriba */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          padding: '10px 14px',
          background: 'var(--bg-hover)',
          borderRadius: '10px',
          border: '1px solid var(--border-light)',
          flexWrap: 'wrap',
        }}
      >
        <Badge variant={estadoBadge.variant} size="lg" dot>
          {estadoBadge.texto}
        </Badge>
        {cargoNombre && (
          <Badge variant="info" size="lg">
            💼 {cargoNombre}
          </Badge>
        )}
      </div>

      {/* Grid */}
      <div
        className="ver-emp-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        <InfoRow icon="👤" label="Nombre">
          {empleado.nombre || '—'}
        </InfoRow>

        <InfoRow icon="👥" label="Apellido">
          {empleado.apellido || '—'}
        </InfoRow>

        <InfoRow icon="📱" label="Teléfono">
          {empleado.telefono || '—'}
        </InfoRow>

        <InfoRow icon="📧" label="Email">
          {empleado.email || '—'}
        </InfoRow>

        <InfoRow icon="💼" label="Cargo">
          {cargoNombre || (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Sin asignar
            </span>
          )}
        </InfoRow>

        {/* 🆕 SUELDO EN USD */}
        <InfoRow icon="💰" label="Sueldo">
          {sueldoFormateado ? (
            <span style={{ color: 'var(--success)', fontWeight: '700' }}>
              {sueldoFormateado} USD
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No asignado
            </span>
          )}
        </InfoRow>

        <InfoRow icon="🚦" label="Estado">
          <Badge variant={estadoBadge.variant} size="sm" dot>
            {estadoBadge.texto}
          </Badge>
        </InfoRow>

        <InfoRow icon="📅" label="Fecha de ingreso">
          {formatearFecha(empleado.fechaIngreso)}
        </InfoRow>
      </div>
    </Modal>
  );
}