// src/Componentes/ReglasComponent/DiasLibresConfig.jsx
import { useState } from 'react';
import Card from '../UI/Card';
import Input from '../UI/Input';
import Button from '../UI/Button';

export default function DiasLibresConfig({ onRefresh, onAsignar, showToast }) {
  const [employeeId, setEmployeeId] = useState('');
  const [semana, setSemana] = useState('');
  const [diasLibresSemana, setDiasLibresSemana] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsignar = async (e) => {
    e.preventDefault();

    if (!employeeId.trim() || !semana || !diasLibresSemana.trim()) {
      showToast?.('Completa todos los campos.', 'warning');
      return;
    }

    const diasArray = diasLibresSemana
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (diasArray.length === 0) {
      showToast?.('Debes indicar al menos un día libre.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await onAsignar(employeeId.trim(), semana, diasArray);

      setEmployeeId('');
      setSemana('');
      setDiasLibresSemana('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.log('Error manejado por Toast:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Asignar Días Libres Rotativos"
      subtitle="Configura los días libres por semana para cada empleado"
      icon="🗓️"
      variant="info"
      style={{ maxWidth: '640px' }}
    >
      <div
        style={{
          background: 'var(--info-soft)',
          border: '1px solid var(--card-info-border)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '13px',
          color: 'var(--card-info-title)',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <span>
          Los días libres rotativos se asignan por semana y se normalizan al
          domingo de esa semana.
        </span>
      </div>

      <form
        onSubmit={handleAsignar}
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

        <Input
          type="date"
          label="Semana (cualquier día)"
          value={semana}
          onChange={(e) => setSemana(e.target.value)}
          icon="📅"
          required
          hint="Se normalizará automáticamente al domingo de esa semana"
        />

        <Input
          label="Días Libres (separados por coma)"
          placeholder="Ej. lunes, martes"
          value={diasLibresSemana}
          onChange={(e) => setDiasLibresSemana(e.target.value)}
          icon="🗓️"
          required
          hint="Días válidos: lunes, martes, miércoles, jueves, viernes, sábado, domingo"
        />

        <Button
          type="submit"
          variant="warning"
          size="lg"
          loading={loading}
          fullWidth
        >
          {loading ? 'Asignando...' : '🗓️ Asignar Días Libres'}
        </Button>
      </form>
    </Card>
  );
}