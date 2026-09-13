// src/Componentes/ReglasComponent/AsignacionesList.jsx
import { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Table from '../UI/Table';
import Button from '../UI/Button';
import Badge from '../UI/Badge';

// 🔧 Función auxiliar: separa nombre(s) y apellido(s)
function separarNombreApellido(nombreCompleto) {
  if (!nombreCompleto) return { nombre: '', apellido: 'N/A' };

  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  const total = partes.length;

  if (total === 1) return { nombre: partes[0], apellido: 'N/A' };
  if (total === 2) return { nombre: partes[0], apellido: partes[1] };
  if (total === 3) return { nombre: partes[0], apellido: partes.slice(1).join(' ') };
  if (total === 4) {
    return {
      nombre: partes.slice(0, 2).join(' '),
      apellido: partes.slice(2).join(' '),
    };
  }

  const mitad = Math.ceil(total / 2);
  return {
    nombre: partes.slice(0, mitad).join(' '),
    apellido: partes.slice(mitad).join(' '),
  };
}

export default function AsignacionesList({ asignaciones, onRefresh }) {
  const [semana, setSemana] = useState('');

  const horariosMap = {
    HORARIO_8_5: '8:00 AM - 5:00 PM',
    HORARIO_8_5_30: '8:00 AM - 5:30 PM',
    HORARIO_8_6_30: '8:00 AM - 6:30 PM',
    HORARIO_8_7: '8:00 AM - 7:00 PM',
    HORARIO_8_8: '8:00 AM - 8:00 PM',
  };

  useEffect(() => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const domingo = new Date(hoy);
    domingo.setDate(hoy.getDate() - dia);
    const year = domingo.getFullYear();
    const month = String(domingo.getMonth() + 1).padStart(2, '0');
    const day = String(domingo.getDate()).padStart(2, '0');
    setSemana(`${year}-${month}-${day}`);
  }, []);

  useEffect(() => {
    if (semana) onRefresh(semana);
  }, [semana]);

  const handleRefresh = () => {
    onRefresh(semana);
  };

  const columnas = [
    {
      key: 'employeeId',
      label: 'Cédula',
      bold: true,
      color: '#2b6cb0',
      width: '120px',
      nowrap: true,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      render: (row) => {
        const { nombre } = separarNombreApellido(row.nombre || '');
        return <span style={{ fontWeight: '500' }}>{nombre}</span>;
      },
    },
    {
      key: 'apellido',
      label: 'Apellido',
      render: (row) => {
        const { apellido } = separarNombreApellido(row.nombre || '');
        return <span style={{ color: '#4a5568' }}>{apellido}</span>;
      },
    },
    {
      key: 'horarioId',
      label: 'Horario',
      render: (row) => (
        <span
          style={{
            background: '#ebf8ff',
            color: '#2b6cb0',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
          }}
        >
          {horariosMap[row.horarioId] || row.horarioId}
        </span>
      ),
    },
    {
      key: 'diasLibresFijos',
      label: 'Días Libres Fijos',
      render: (row) => {
        if (!row.diasLibresFijos || row.diasLibresFijos.length === 0) {
          return (
            <span style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '12px' }}>
              Sin fijos
            </span>
          );
        }
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {row.diasLibresFijos.map((dia, i) => (
              <Badge key={i} variant="warning" size="sm">
                {dia}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'diasLibresRotativos',
      label: 'Días Libres Semana',
      render: (row) => {
        if (!row.diasLibresRotativos || row.diasLibresRotativos.length === 0) {
          return (
            <span style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '12px' }}>
              Sin rotativos
            </span>
          );
        }
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {row.diasLibresRotativos.map((dia, i) => (
              <Badge key={i} variant="info" size="sm" dot>
                {dia}
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <Card
      title="Asignaciones Semanales"
      subtitle="Consulta los horarios y días libres por semana"
      icon="📅"
      variant="default"
      padding="none"
      headerStyle={{ padding: '16px 20px' }}
      bodyStyle={{ padding: '0' }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          background: '#f7fafc',
        }}
      >
        <label style={{ fontSize: '13px', color: '#4a5568', fontWeight: '600' }}>
          Semana:
        </label>
        <input
          type="date"
          value={semana}
          onChange={(e) => setSemana(e.target.value)}
          style={{
            padding: '0 14px',
            height: '38px',
            border: '1px solid #cbd5e0',
            borderRadius: '8px',
            fontSize: '13px',
            outline: 'none',
            color: '#2d3748',
            backgroundColor: '#ffffff',
            colorScheme: 'light',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            minWidth: '160px',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3182ce';
            e.target.style.boxShadow = '0 0 0 3px rgba(49, 130, 206, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#cbd5e0';
            e.target.style.boxShadow = 'none';
          }}
        />
        <Button variant="success" size="sm" onClick={handleRefresh}>
          🔄 Refrescar
        </Button>
      </div>

      <Table
        columns={columnas}
        data={asignaciones || []}
        theme="light"
        hoverable
        striped
        size="md"
        emptyMessage="No hay asignaciones para esta semana"
        emptyIcon="📭"
      />
    </Card>
  );
}