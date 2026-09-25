// src/RRH/Departamentos/Componentes/EditarDepartamentoModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../../Componentes/UI/Modal';
import Input from '../../../Componentes/UI/Input';
import Button from '../../../Componentes/UI/Button';
import { sanitizarNombre, sanitizarTexto } from '../../../utils/validaciones';

export default function EditarDepartamentoModal({
  isOpen,
  onClose,
  departamento,
  onGuardar,
}) {
  const [nombre, setNombre] = useState('');

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!isOpen || !departamento) return;
    setNombre(departamento.nombre || '');
    setErrores({});
  }, [isOpen, departamento]);

  const validar = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio';
    else if (nombre.trim().length < 2) e.nombre = 'Mínimo 2 caracteres';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validar()) return;

    setLoading(true);
    try {
      const dto = {
        nombre: sanitizarNombre(nombre).trim() || nombre.trim(),
      };
      await onGuardar(departamento.nombre, dto);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Departamento"
      subtitle={
        departamento?.nombre ? `Departamento: ${departamento.nombre}` : ''
      }
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
          label="Nombre del departamento"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          error={errores.nombre}
          maxLength={100}
        />
      </form>
    </Modal>
  );
}