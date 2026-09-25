// src/GestionPersonal/Componentes/EditarEmpleadoModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../Componentes/UI/Modal';
import Input from '../../Componentes/UI/Input';
import Select from '../../Componentes/UI/Select';
import Button from '../../Componentes/UI/Button';

import {
  sanitizarNombre,
  sanitizarTelefono,
  sanitizarEmail,
  validarDtoEmpleado,
} from '../../utils/validaciones';

// 🆕 Helper: extrae nombre del cargo (string u objeto)
const obtenerNombreCargo = (cargo) => {
  if (!cargo) return '';
  if (typeof cargo === 'string') return cargo;
  return cargo.nombre || '';
};

const fechaISOaInput = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

export default function EditarEmpleadoModal({
  isOpen,
  onClose,
  empleado,
  onGuardar,
  cargos = [],   // 🆕
}) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [estado, setEstado] = useState('ACTIVO');
  const [cargoSeleccionado, setCargoSeleccionado] = useState(''); // 🆕

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!isOpen || !empleado) return;
    setNombre(empleado.nombre || '');
    setApellido(empleado.apellido || '');
    setEmail(empleado.email || '');
    setTelefono(empleado.telefono || '');
    setFechaIngreso(fechaISOaInput(empleado.fechaIngreso));
    setEstado(empleado.estado || 'ACTIVO');
    setCargoSeleccionado(obtenerNombreCargo(empleado.cargo)); // 🆕
    setErrores({});
  }, [isOpen, empleado]);

  // 🛡️ Handlers con sanitización
  const handleNombreChange = (e) => setNombre(sanitizarNombre(e.target.value));
  const handleApellidoChange = (e) =>
    setApellido(sanitizarNombre(e.target.value));
  const handleEmailChange = (e) => setEmail(sanitizarEmail(e.target.value));
  const handleTelefonoChange = (e) =>
    setTelefono(sanitizarTelefono(e.target.value));

  const validar = () => {
    const resultado = validarDtoEmpleado({
      cedula: empleado.cedula,
      nombre,
      apellido,
      email,
      telefono,
      fechaIngreso,
    });
    setErrores(resultado.errores);
    return resultado;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const { valido, valores } = validar();
    if (!valido) return;

    setLoading(true);
    try {
      const dto = {
        cedula: empleado.cedula,
        nombre: valores.nombre,
        apellido: valores.apellido,
        email: valores.email || undefined,
        telefono: valores.telefono || undefined,
        fechaIngreso: valores.fechaIngreso || undefined,
        estado,
        // 🆕 Enviar cargo SOLO si cambió
        ...(cargoSeleccionado !== obtenerNombreCargo(empleado.cargo) && {
          cargo: cargoSeleccionado,
        }),
      };
      await onGuardar(dto);
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
        iconLeft="💾"
      >
        Guardar cambios
      </Button>
    </>
  );

  // 🆕 Opciones del selector de cargos
  const opcionesCargos = cargos.map((c) => ({
    value: c.nombre,
    label: c.sueldo
      ? `${c.nombre} — $${Number(c.sueldo).toFixed(2)}`
      : c.nombre,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Empleado"
      subtitle={`Cédula ${empleado?.cedula || ''}`}
      icon="✏️"
      variant="warning"
      size="md"
      footer={footer}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <Input
          label="Cédula"
          value={empleado?.cedula || ''}
          disabled
          hint="La cédula no se puede modificar"
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <Input
            label="Nombre"
            value={nombre}
            onChange={handleNombreChange}
            required
            error={errores.nombre}
            maxLength={100}
          />
          <Input
            label="Apellido"
            value={apellido}
            onChange={handleApellidoChange}
            required
            error={errores.apellido}
            maxLength={100}
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Ej: nombre@empresa.com"
          icon="📧"
          error={errores.email}
          maxLength={100}
        />

        <Input
          label="Teléfono"
          value={telefono}
          onChange={handleTelefonoChange}
          placeholder="Ej: 04141234567"
          icon="📱"
          error={errores.telefono}
          maxLength={20}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <Input
            label="Fecha de ingreso"
            type="date"
            value={fechaIngreso}
            onChange={(e) => setFechaIngreso(e.target.value)}
          />
          <Select
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            options={[
              { value: 'ACTIVO', label: '✅ Activo' },
              { value: 'INACTIVO', label: '🚫 Inactivo' },
              { value: 'SUSPENDIDO', label: '⏸️ Suspendido' },
            ]}
          />
        </div>

        {/* 🆕 SELECTOR DE CARGO */}
        <Select
          label="Cargo"
          value={cargoSeleccionado}
          onChange={(e) => setCargoSeleccionado(e.target.value)}
          options={[
            { value: '', label: 'Sin cargo asignado' },
            ...opcionesCargos,
          ]}
          placeholder="Selecciona un cargo..."
          hint="Cambia el cargo aquí si el empleado asciende o cambia de rol"
        />
      </form>
    </Modal>
  );
}