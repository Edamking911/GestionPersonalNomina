// src/GestionPersonal/Componentes/CrearEmpleadoModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../Componentes/UI/Modal';
import Input from '../../Componentes/UI/Input';
import Select from '../../Componentes/UI/Select';
import Button from '../../Componentes/UI/Button';
import {
  sanitizarCedula,
  sanitizarNombre,
  sanitizarTelefono,
  sanitizarEmail,
  validarDtoEmpleado,
  validarCargo,
} from '../../utils/validaciones';

const fechaHoy = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

export default function CrearEmpleadoModal({ isOpen, onClose, onGuardar }) {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [nombreCargo, setNombreCargo] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState(fechaHoy());
  const [estado, setEstado] = useState('ACTIVO');

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setCedula('');
    setNombre('');
    setApellido('');
    setNombreCargo('');
    setEmail('');
    setTelefono('');
    setFechaIngreso(fechaHoy());
    setEstado('ACTIVO');
    setErrores({});
  }, [isOpen]);

  // 🛡️ Handlers con sanitización en vivo
  const handleCedulaChange = (e) => {
    setCedula(sanitizarCedula(e.target.value));
  };

  const handleNombreChange = (e) => {
    setNombre(sanitizarNombre(e.target.value));
  };

  const handleApellidoChange = (e) => {
    setApellido(sanitizarNombre(e.target.value));
  };

  const handleEmailChange = (e) => {
    setEmail(sanitizarEmail(e.target.value));
  };

  const handleTelefonoChange = (e) => {
    setTelefono(sanitizarTelefono(e.target.value));
  };

  const handleCargoChange = (e) => {
    setNombreCargo(e.target.value);
  };

  const validar = () => {
    const e = {};

    // 🛡️ Validación del DTO completo
    const resultado = validarDtoEmpleado({
      cedula,
      nombre,
      apellido,
      email,
      telefono,
      fechaIngreso,
    });

    if (!resultado.valido) {
      Object.assign(e, resultado.errores);
    }

    // 🛡️ Validar cargo aparte
    const vCargo = validarCargo(nombreCargo);
    if (!vCargo.valido) e.nombreCargo = vCargo.error;

    setErrores(e);
    return {
      valido: Object.keys(e).length === 0,
      valores: resultado.valores,
    };
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    const { valido, valores } = validar();
    if (!valido) {
      // 🚫 No continuar si hay errores
      return;
    }

    setLoading(true);
    try {
      const dto = {
        cedula: valores.cedula,
        nombre: valores.nombre,
        apellido: valores.apellido,
        email: valores.email || undefined,
        telefono: valores.telefono || undefined,
        fechaIngreso: valores.fechaIngreso || undefined,
        estado,
      };
      await onGuardar(sanitizarNombre(nombreCargo).trim() || nombreCargo.trim(), dto);
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
        iconLeft="➕"
      >
        Crear empleado
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Empleado"
      subtitle="Registra un nuevo empleado en el sistema"
      icon="👤"
      variant="info"
      size="md"
      footer={footer}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <Input
          label="Cédula"
          value={cedula}
          onChange={handleCedulaChange}
          placeholder="Ej: 22652518"
          icon="🆔"
          required
          error={errores.cedula}
          hint="Solo números, sin puntos ni guiones"
          maxLength={10}
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
            placeholder="Ej: Juan"
            required
            error={errores.nombre}
            maxLength={100}
          />
          <Input
            label="Apellido"
            value={apellido}
            onChange={handleApellidoChange}
            placeholder="Ej: Pérez"
            required
            error={errores.apellido}
            maxLength={100}
          />
        </div>

        <Input
          label="Cargo"
          value={nombreCargo}
          onChange={handleCargoChange}
          placeholder="Ej: Contador, Analista de RRHH"
          icon="💼"
          required
          error={errores.nombreCargo}
          hint="El cargo debe existir en el sistema"
        />

        <Input
          label="Email (opcional)"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Ej: juan@empresa.com"
          icon="📧"
          error={errores.email}
          maxLength={100}
        />

        <Input
          label="Teléfono (opcional)"
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

        {/* 🛡️ Aviso de seguridad */}
        <div
          style={{
            background: 'var(--info-soft)',
            border: '1px solid var(--card-info-border)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '11px',
            color: 'var(--card-info-title)',
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <span>🛡️</span>
          <span>
            Los campos se validan automáticamente. Caracteres especiales no
            permitidos se eliminan.
          </span>
        </div>
      </form>
    </Modal>
  );
}