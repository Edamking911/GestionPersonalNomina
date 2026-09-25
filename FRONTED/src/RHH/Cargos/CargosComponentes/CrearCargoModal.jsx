// src/RRH/Cargos/Componentes/CrearCargoModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../../Componentes/UI/Modal';
import Input from '../../../Componentes/UI/Input';
import Select from '../../../Componentes/UI/Select';
import Button from '../../../Componentes/UI/Button';
import {
  sanitizarNombreEntidad,
  sanitizarTexto,
  validarCargo,
} from '../../../utils/validaciones';

export default function CrearCargoModal({
  isOpen,
  onClose,
  onGuardar,
  departamentos,
}) {
  const [nombre, setNombre] = useState('');
  const [nombreDepartamento, setNombreDepartamento] = useState('');
  const [sueldo, setSueldo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setNombre('');
    setNombreDepartamento('');
    setSueldo('');
    setDescripcion('');
    setErrores({});
  }, [isOpen]);

  const handleNombreChange = (e) => {
    setNombre(sanitizarNombreEntidad(e.target.value));
  };

  const handleDescripcionChange = (e) => {
    setDescripcion(sanitizarTexto(e.target.value));
  };

  const handleSueldoChange = (e) => {
    const v = e.target.value;
    if (v === '' || /^\d*\.?\d*$/.test(v)) {
      setSueldo(v);
    }
  };

  const validar = () => {
    const e = {};

    const vNombre = validarCargo(nombre);
    if (!vNombre.valido) e.nombre = vNombre.error;

    if (!nombreDepartamento)
      e.nombreDepartamento = 'Selecciona un departamento';

    if (sueldo !== '' && sueldo !== null) {
      const num = Number(sueldo);
      if (isNaN(num) || num < 0) e.sueldo = 'Sueldo inválido';
      else if (num > 1000000) e.sueldo = 'Máximo 1,000,000';
    }

    setErrores(e);
    return Object.keys(e).length === 0 ? { valido: true, nombre: vNombre.valor } : { valido: false };
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const r = validar();
    if (!r.valido) return;

    setLoading(true);
    try {
      const dto = {
        nombre: r.nombre,
        sueldo: sueldo ? Number(sueldo) : undefined,
        descripcion: descripcion || undefined,
      };
      await onGuardar(nombreDepartamento, dto);
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
        Crear cargo
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Cargo"
      subtitle="Registra un nuevo cargo en el sistema"
      icon="💼"
      variant="info"
      size="md"
      footer={footer}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <Input
          label="Nombre del cargo"
          value={nombre}
          onChange={handleNombreChange}
          placeholder="Ej: Contador, Analista de RRHH"
          icon="💼"
          required
          error={errores.nombre}
          maxLength={100}
          hint="Solo letras, números, espacios y puntos"
        />

        <Select
          label="Departamento"
          value={nombreDepartamento}
          onChange={(e) => setNombreDepartamento(e.target.value)}
          options={[
            { value: '', label: 'Selecciona un departamento...' },
            ...departamentos.map((d) => ({
              value: d.nombre,
              label: d.nombre,
            })),
          ]}
          required
          error={errores.nombreDepartamento}
          hint="El cargo pertenecerá a este departamento"
        />

        <Input
          label="Sueldo (USD) — opcional"
          type="number"
          value={sueldo}
          onChange={handleSueldoChange}
          placeholder="Ej: 350"
          icon="💰"
          error={errores.sueldo}
          min="0"
          max="1000000"
          step="0.01"
        />

        <Input
          label="Descripción — opcional"
          value={descripcion}
          onChange={handleDescripcionChange}
          placeholder="Ej: Encargado de la contabilidad general"
          icon="📝"
          maxLength={200}
        />

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
          <span>Los símbolos SQL como <code>--</code> o <code>;</code> se bloquean automáticamente.</span>
        </div>
      </form>
    </Modal>
  );
}