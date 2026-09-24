// src/Componentes/ReglasComponent/Novedades/NovedadDetalleModal.jsx
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { getTipoInfo, formatearFecha, calcularDias } from './constants';

const InfoRow = ({ label, children }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-light)',
      fontSize: '13px',
      gap: '12px',
    }}
  >
    <span
      style={{
        color: 'var(--text-muted)',
        fontSize: '11px',
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: '0.4px',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
    <span
      style={{
        color: 'var(--text-primary)',
        fontWeight: '600',
        textAlign: 'right',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </span>
  </div>
);

export default function NovedadDetalleModal({
  isOpen,
  onClose,
  novedad,
  onEditar,
  onEliminar,
  onDescargarPDF,
}) {
  if (!novedad) return null;

  const tipoInfo = getTipoInfo(novedad.tipo);
  const dias = calcularDias(novedad.fechaInicio, novedad.fechaFin);
  const nombreCompleto = novedad.empleado
    ? `${novedad.empleado.nombre || ''} ${novedad.empleado.apellido || ''}`.trim()
    : '—';

  const footer = (
    <>
      <Button variant="ghost" size="md" onClick={onClose}>
        Cerrar
      </Button>
      <Button variant="dark" size="md" onClick={onDescargarPDF} iconLeft="📄">
        Constancia PDF
      </Button>
      <Button variant="warning" size="md" onClick={onEditar} iconLeft="✏️">
        Editar
      </Button>
      {novedad.activo && (
        <Button variant="danger" size="md" onClick={onEliminar} iconLeft="🗑️">
          Desactivar
        </Button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Novedad"
      subtitle={`${tipoInfo.label} · Cédula ${novedad.cedula}`}
      icon={tipoInfo.label.split(' ')[0]}
      variant={tipoInfo.variant}
      size="md"
      footer={footer}
    >
      <div>
        {/* Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'var(--bg-hover)',
            borderRadius: '10px',
            border: '1px solid var(--border-light)',
            flexWrap: 'wrap',
          }}
        >
          <Badge variant={tipoInfo.variant} size="lg">
            {tipoInfo.label}
          </Badge>
          <Badge variant={novedad.activo ? 'success' : 'danger'} size="lg" dot>
            {novedad.activo ? 'Activa' : 'Inactiva'}
          </Badge>
        </div>

        <InfoRow label="Cédula">
          <span style={{ fontFamily: 'monospace' }}>{novedad.cedula}</span>
        </InfoRow>

        <InfoRow label="Empleado">{nombreCompleto}</InfoRow>

        <InfoRow label="Desde">{formatearFecha(novedad.fechaInicio)}</InfoRow>

        <InfoRow label="Hasta">{formatearFecha(novedad.fechaFin)}</InfoRow>

        <InfoRow label="Días">
          <Badge variant="info" size="md">
            {dias} día{dias !== 1 ? 's' : ''}
          </Badge>
        </InfoRow>

        {novedad.motivo && <InfoRow label="Motivo">{novedad.motivo}</InfoRow>}

        {novedad.documentoSoporte && (
          <InfoRow label="Documento">{novedad.documentoSoporte}</InfoRow>
        )}

        {novedad.createdAt && (
          <InfoRow label="Registrada el">
            {new Date(novedad.createdAt).toLocaleString('es-VE')}
          </InfoRow>
        )}
      </div>
    </Modal>
  );
}