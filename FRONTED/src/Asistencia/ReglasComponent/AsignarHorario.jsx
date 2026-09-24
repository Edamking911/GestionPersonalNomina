// src/Componentes/ReglasComponent/AsignarHorario.jsx
import { useState } from 'react';
import Card from '../../Componentes/UI/Card';
import Input from '../../Componentes/UI/Input';
import Select from '../../Componentes/UI/Select';
import Button from '../../Componentes/UI/Button';

export default function AsignarHorario({ onAsignar, showToast }) {
  const [employeeId, setEmployeeId] = useState('');
  const [horarioId, setHorarioId] = useState('');
  const [diasLibresFijos, setDiasLibresFijos] = useState('');
  const [loading, setLoading] = useState(false);

  const horariosDisponibles = [
    { value: 'HORARIO_8_5', label: '8:00 AM - 5:00 PM' },
    { value: 'HORARIO_8_5_30', label: '8:00 AM - 5:30 PM' },
    { value: 'HORARIO_8_6_30', label: '8:00 AM - 6:30 PM' },
    { value: 'HORARIO_8_7', label: '8:00 AM - 7:00 PM' },
    { value: 'HORARIO_8_8', label: '8:00 AM - 8:00 PM' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeId.trim()) {
      showToast?.('La cédula del empleado es obligatoria.', 'warning');
      return;
    }
    if (!horarioId) {
      showToast?.('Debes seleccionar un horario.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const diasArray = diasLibresFijos
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      await onAsignar(employeeId.trim(), horarioId, diasArray);

      setEmployeeId('');
      setHorarioId('');
      setDiasLibresFijos('');
    } catch (err) {
      console.log('Error manejado por Toast:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Asignar Horario a Empleado"
      subtitle="Configura el turno y los días libres del empleado"
      icon="➕"
      variant="info"
      style={{ maxWidth: '640px' }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        <Input
          label="Cédula del Empleado"
          placeholder="Cedula"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value.replace(/\D/g, ''))}
          icon="👤"
          required
          hint="Solo números, sin puntos ni guiones"
        />

        <Select
          label="Horario de Trabajo"
          value={horarioId}
          onChange={(e) => setHorarioId(e.target.value)}
          options={horariosDisponibles}
          placeholder="Selecciona un horario..."
          required
          hint="El horario aplica a todos los días laborables"
        />

        <Input
          label="Días Libres Fijos (opcional)"
          placeholder="Ej. sábado, domingo"
          value={diasLibresFijos}
          onChange={(e) => setDiasLibresFijos(e.target.value)}
          icon="📅"
          hint="Separa los días con coma. Si no aplica, déjalo vacío."
        />

        <Button
          type="submit"
          variant="success"
          size="lg"
          loading={loading}
          fullWidth
        >
          {loading ? 'Asignando...' : '✅ Asignar Horario'}
        </Button>
      </form>
    </Card>
  );
}