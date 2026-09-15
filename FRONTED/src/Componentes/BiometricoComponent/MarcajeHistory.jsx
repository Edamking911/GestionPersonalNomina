// src/Componentes/BiometricoComponent/MarcajesHistory.jsx
import { useMemo } from 'react';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import Pagination from '../UI/Paginacion';
import { usePagination } from '../../Hoosk/PaginacionHoosk';

// 📅 Constantes y helpers fuera del componente (evita recrear en cada render)
const MESES = {
  enero: 0, febrero: 1, marzo: 2, abril: 3,
  mayo: 4, junio: 5, julio: 6, agosto: 7,
  septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

const parsearFecha = (fechaStr) => {
  try {
    const match = fechaStr.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/i);
    if (!match) return new Date(0);
    const dia = parseInt(match[1], 10);
    const mes = MESES[match[2].toLowerCase()] ?? 0;
    const anio = parseInt(match[3], 10);
    return new Date(anio, mes, dia);
  } catch {
    return new Date(0);
  }
};

const formatearFecha = (fechaStr) => {
  try {
    if (fechaStr.includes('de ') && fechaStr.includes(',')) {
      return fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
    }
    const partes = fechaStr.split('/');
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const anio = parseInt(partes[2], 10);
      const fecha = new Date(anio, mes, dia);
      return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return fechaStr;
  } catch {
    return fechaStr;
  }
};

const thStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: '11px',
  textTransform: 'uppercase',
  fontWeight: '700',
};

export default function MarcajesHistory({ registrosFecha }) {
  // 📊 Ordenar los días (se hace ANTES del early return para cumplir reglas de hooks)
  const registrosOrdenados = useMemo(() => {
    const base = registrosFecha?.registrosPorFecha || [];
    return [...base].sort(
      (a, b) => parsearFecha(a.fecha).getTime() - parsearFecha(b.fecha).getTime(),
    );
  }, [registrosFecha]);

  // 📄 Paginación por DÍAS
  const pagination = usePagination(registrosOrdenados, {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50, 100],
    resetKeys: [registrosFecha],
  });

  const totalRegistros = registrosOrdenados.reduce(
    (sum, item) => sum + (item.totalMarcajes || 0),
    0,
  );

  if (!registrosFecha || !registrosFecha.registrosPorFecha) {
    return (
      <Card variant="default">
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            padding: '20px',
          }}
        >
          Cargando historial de marcajes...
        </p>
      </Card>
    );
  }

  return (
    <div>
      {/* Encabezado global */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '18px',
            color: 'var(--text-primary)',
          }}
        >
          📊 Historial Cronológico de Marcajes
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge variant="info" size="md">
            📅 {registrosOrdenados.length} días
          </Badge>
          <Badge variant="success" size="md">
            ✅ {totalRegistros} marcajes
          </Badge>
        </div>
      </div>

      {/* Lista de días paginada */}
      {registrosOrdenados.length > 0 ? (
        <>
          {pagination.paginatedItems.map((item, idx) => (
            <div key={`${item.fecha}-${idx}`} style={{ marginBottom: '20px' }}>
              <Card
                padding="none"
                variant="info"
                headerStyle={{ padding: '0' }}
                bodyStyle={{ padding: '0' }}
              >
                {/* Header del día */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-light)',
                    background: 'var(--card-info-header)',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      color: 'var(--card-info-title)',
                      fontSize: '15px',
                    }}
                  >
                    📅 {formatearFecha(item.fecha)}
                  </h4>
                  <Badge variant="info" size="sm">
                    {item.totalMarcajes}{' '}
                    {item.totalMarcajes === 1 ? 'marcaje' : 'marcajes'}
                  </Badge>
                </div>

                {/* Tabla */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    background: 'var(--table-row-bg)',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: 'var(--table-header-bg)',
                        color: 'var(--table-header-text)',
                        borderBottom: '1px solid var(--table-header-border)',
                      }}
                    >
                      <th style={thStyle}>Cédula</th>
                      <th style={thStyle}>Empleado</th>
                      <th style={thStyle}>Hora de Marcaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.marcajes.map((m, mIdx) => (
                      <tr
                        key={mIdx}
                        style={{
                          borderBottom: '1px solid var(--table-row-border)',
                          background:
                            mIdx % 2 === 0
                              ? 'var(--table-row-bg)'
                              : 'var(--table-row-bg-alt)',
                        }}
                      >
                        <td
                          style={{
                            padding: '8px 12px',
                            fontWeight: '600',
                            color: 'var(--primary)',
                          }}
                        >
                          {m.empleadoId || m.employeeId}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: 'var(--table-row-text)',
                          }}
                        >
                          {m.nombre || m.name}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: 'var(--success)',
                            fontWeight: '600',
                          }}
                        >
                          {m.horaLocal || m.hora || m.tiempo || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          ))}

          {/* 📄 Paginación de días */}
          <div
            style={{
              borderRadius: '10px',
              border: '1px solid var(--table-row-border)',
              overflow: 'hidden',
            }}
          >
            <Pagination {...pagination} />
          </div>
        </>
      ) : (
        <Card variant="default">
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: '20px',
            }}
          >
            No hay marcajes registrados.
          </p>
        </Card>
      )}
    </div>
  );
}