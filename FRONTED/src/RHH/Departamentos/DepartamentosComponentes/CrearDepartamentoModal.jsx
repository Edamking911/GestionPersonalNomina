// src/RRH/Departamentos/Componentes/CrearDepartamentoModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../../Componentes/UI/Modal';
import Input from '../../../Componentes/UI/Input';
import Button from '../../../Componentes/UI/Button';
import {
  sanitizarNombreEntidad,
  validarDepartamento,
} from '../../../utils/validaciones';

export default function CrearDepartamentoModal({ isOpen, onClose, onGuardar }) {
  const [nombre, setNombre] = useState('');

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setNombre('');
    setErrores({});
  }, [isOpen]);

  // 🛡️ Sanitizar en vivo (rechaza `--` al escribir)
  const handleChange = (e) => {
    setNombre(sanitizarNombreEntidad(e.target.value));
  };

  const validar = () => {
    const e = {};
    const v = validarDepartamento(nombre);
    if (!v.valido) e.nombre = v.error;
    setErrores(e);
    return v;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const v = validar();
    if (!v.valido) return;

    setLoading(true);
    try {
      // ✅ Solo enviamos el valor sanitizado
      await onGuardar({ nombre: v.valor });
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
        Crear departamento
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Departamento"
      subtitle="Registra un nuevo departamento en el sistema"
      icon="🏢"
      variant="info"
      size="md"
      footer={footer}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <Input
          label="Nombre del departamento"
          value={nombre}
          onChange={handleChange}
          placeholder="Ej: Recursos Humanos"
          icon="🏢"
          required
          error={errores.nombre}
          maxLength={100}
          hint="Solo letras, números, espacios y puntos. Sin símbolos raros."
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
          <span>
            Los símbolos como <code>--</code>, <code>;</code>, <code>'</code> se
            bloquean automáticamente.
          </span>
        </div>
      </form>
    </Modal>
  );
}