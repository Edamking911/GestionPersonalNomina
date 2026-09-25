// src/RRH/Cargos/Componentes/EditarCargoModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../../Componentes/UI/Modal';
import Input from '../../../Componentes/UI/Input';
import Button from '../../../Componentes/UI/Button';
import {
  sanitizarNombreEntidad,
  validarDepartamento,
} from '../../../utils/validaciones';

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
      await onGuardar(departamento.nombre, { nombre: v.valor });
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
      subtitle={departamento?.nombre ? `Departamento: ${departamento.nombre}` : ''}
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
          onChange={handleChange}
          required
          error={errores.nombre}
          maxLength={100}
          hint="Solo letras, números, espacios y puntos"
        />
      </form>
    </Modal>
  );
}
