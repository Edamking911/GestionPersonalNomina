import { Injectable } from '@nestjs/common';
import { MarcajesStorageService } from '../Storage/marcajes-storage.service';
import { parseEventType } from '../Utils/Events-types.util';

@Injectable()
export class MarcajesQueryService {
  constructor(private readonly storage: MarcajesStorageService) {}

  getFormattedEvents(employeeIdFilter?: string) {
    let records = this.storage.getSavedEvents();
    if (employeeIdFilter) {
      records = records.filter((r) => r.employeeId === employeeIdFilter);
    }

    const events = records
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .map((r) => ({
        empleadoId: r.employeeId,
        nombre: r.employeeName || 'DESCONOCIDO',
        metodoMarcaje: parseEventType(r.rawType),
        horaLocal: r.horaLocal,
        timestampISO: r.timestamp,
        dispositivo: r.deviceName,
      }));

    return { totalRecords: events.length, events };
  }

  getStats() {
    const events = this.storage.getSavedEvents();
    const byDay: any = {};
    const byEmployee: any = {};

    events.forEach((e) => {
      const day = new Date(e.timestamp).toLocaleDateString('es-VE');
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(e);

      if (!byEmployee[e.employeeId]) {
        byEmployee[e.employeeId] = {
          nombre: e.employeeName || 'DESCONOCIDO',
          totalMarcajes: 0,
          ultimoMarcaje: null,
        };
      }
      byEmployee[e.employeeId].totalMarcajes++;
      byEmployee[e.employeeId].ultimoMarcaje = e.horaLocal;
    });

    return {
      totalRegistros: events.length,
      totalDias: Object.keys(byDay).length,
      totalEmpleados: Object.keys(byEmployee).length,
      registrosPorDia: Object.keys(byDay).map((day) => ({
        fecha: day,
        total: byDay[day].length,
        empleadosUnicos: new Set(
          byDay[day].map((e: any) => e.employeeId),
        ).size,
      })),
      resumenPorEmpleado: Object.keys(byEmployee).map((id) => ({
        empleadoId: id,
        ...byEmployee[id],
      })),
    };
  }

  getAllRecordsOrderedByDate() {
    const events = this.storage
      .getSavedEvents()
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    const grouped: any = {};

    events.forEach((record) => {
      const timestamp = new Date(record.timestamp);
      const dateKey = timestamp.toLocaleDateString('es-VE');

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          fecha: timestamp.toLocaleDateString('es-VE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          totalMarcajes: 0,
          marcajes: [],
        };
      }
      grouped[dateKey].totalMarcajes++;
      grouped[dateKey].marcajes.push({
        empleadoId: record.employeeId,
        nombre: record.employeeName || 'DESCONOCIDO',
        horaLocal: record.horaLocal,
        timestampISO: timestamp,
        metodoMarcaje: parseEventType(record.rawType),
        dispositivo: record.deviceName,
      });
    });

    const sortedDates = Object.keys(grouped).sort();

    return {
      totalRegistros: events.length,
      totalDias: sortedDates.length,
      registrosPorFecha: sortedDates.map((key) => ({
        fecha: grouped[key].fecha,
        totalMarcajes: grouped[key].totalMarcajes,
        marcajes: grouped[key].marcajes,
      })),
    };
  }

  async getMarcajesPorFecha(fechaStr: string) {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);

    const eventos = this.storage.getSavedEvents();

    const marcajesDia = eventos
      .filter((ev) => {
        const d = new Date(ev.timestamp);
        return (
          d.toLocaleDateString('es-VE') === fecha.toLocaleDateString('es-VE')
        );
      })
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    return {
      success: true,
      fecha: fecha.toLocaleDateString('es-VE'),
      totalMarcajes: marcajesDia.length,
      marcajes: marcajesDia.map((ev) => ({
        employeeId: ev.employeeId,
        nombre: ev.employeeName || 'DESCONOCIDO',
        hora: ev.horaLocal,
        timestamp: ev.timestamp,
        metodoMarcaje: parseEventType(ev.rawType),
        dispositivo: ev.deviceName,
      })),
    };
  }
}