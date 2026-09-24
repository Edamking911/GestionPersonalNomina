// src/Componentes/ReglasComponent/Novedades/NuevaNovedadModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { TIPOS_NOVEDAD, formatearFechaISO } from './constants';

export default function NuevaNovedadModal({
  isOpen,
  onClose,
  onSave,
  novedad,
  modoEdicion,
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [tipo, setTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [documentoSoporte, setDocumentoSoporte] = useState('');

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  // Precargar cuando abre
  useEffect(() => {
    if (!isOpen) return;

    if (modoEdicion && novedad) {
      setEmployeeId(novedad.cedula || novedad.employeeId || '');
      setTipo(novedad.tipo || '');
      setFechaInicio(formatearFechaISO(novedad.fechaInicio));
      setFechaFin(formatearFechaISO(novedad.fechaFin));
      setMotivo(novedad.motivo || '');
      setDocumentoSoporte(novedad.documentoSoporte || '');
    } else {
      setEmployeeId('');
      setTipo('');
      setFechaInicio('');
      setFechaFin('');
      setMotivo('');
      setDocumentoSoporte('');
    }
    setErrores({});
  }, [isOpen, novedad, modoEdicion]);

  const validar = () => {
    const e = {};
    if (!employeeId.trim()) e.employeeId = 'La cédula es obligatoria';
    if (!tipo) e.tipo = 'Selecciona un tipo';
    if (!fechaInicio) e.fechaInicio = 'Fecha de inicio requerida';
    if (!fechaFin) e.fechaFin = 'Fecha de fin requerida';
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      e.fechaFin = 'La fecha fin no puede ser menor a la fecha inicio';
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validar()) return;

    setLoading(true);
    try {
      const dto = {
        employeeId: employeeId.trim(),
        tipo,
        fechaInicio,
        fechaFin,
        motivo: motivo.trim() || undefined,
        documentoSoporte: documentoSoporte.trim() || undefined,
      };
      await onSave(dto);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
        Cancelar
      </Button>
      <Button
        variant="success"
        size="md"
        onClick={handleSubmit}
        loading={loading}
        iconLeft={modoEdicion ? '💾' : '➕'}
      >
        {modoEdicion ? 'Guardar cambios' : 'Crear novedad'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modoEdicion ? 'Editar Novedad' : 'Nueva Novedad'}
      subtitle={
        modoEdicion
          ? `Editando novedad de ${novedad?.cedula}`
          : 'Registra una novedad de nómina para un empleado'
      }
      icon="🏖️"
      variant="info"
      size="md"
      footer={footer}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <Input
          label="Cédula del empleado"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value.replace(/\D/g, ''))}
          placeholder="Cedula"
          icon="👤"
          required
          error={errores.employeeId}
          disabled={modoEdicion}
          hint={
            modoEdicion
              ? 'No se puede cambiar la cédula al editar'
              : 'Solo números, sin puntos ni guiones'
          }
        />

        <Select
          label="Tipo de novedad"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          options={TIPOS_NOVEDAD}
          placeholder="Selecciona un tipo..."
          required
          error={errores.tipo}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <Input
            label="Fecha inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            required
            error={errores.fechaInicio}
          />
          <Input
            label="Fecha fin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            required
            error={errores.fechaFin}
          />
        </div>

        <Input
          label="Motivo (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: Vacaciones programadas"
          icon="📝"
        />

        <Input
          label="Documento soporte (opcional)"
          value={documentoSoporte}
          onChange={(e) => setDocumentoSoporte(e.target.value)}
          placeholder="Ej: Certificado médico #456"
          icon="📎"
        />
      </form>
    </Modal>
  );
}