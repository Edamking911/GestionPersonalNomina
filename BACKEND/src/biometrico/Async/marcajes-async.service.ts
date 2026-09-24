import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as xml2js from 'xml2js';
import { BiometricDeviceProvider } from '../Providers/biometrico-device.provider';
import { MarcajesStorageService } from '../Storage/marcajes-storage.service';
import { AttendanceRecord } from '../Interfaces/biometrico-device.interface';
import { delay } from '../Utils/Events-types.util';

@Injectable()
export class MarcajesSyncService {
  private readonly logger = new Logger(MarcajesSyncService.name);
  private errorCount = 0;
  private lastErrorLog = 0;
  private isSyncing = false;
  private lastSyncTime: Date | null = null;

  constructor(
    private readonly deviceProvider: BiometricDeviceProvider,
    private readonly storage: MarcajesStorageService,
  ) {}

  // ============ CRON ============
  @Cron('*/10 * * * * *')
  async handleAutoSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const r = await this.syncAllLogsFromDevice();
      this.logger.log(
        `⏰ Cron: ${r.totalEventosValidos} válidos, ${r.totalRegistrosNuevosGuardados} nuevos`,
      );
      this.errorCount = 0;
    } catch (error: any) {
      const now = Date.now();
      if (now - this.lastErrorLog > 60000) {
        this.errorCount++;
        this.logger.warn(`⚠️ Error #${this.errorCount}: ${error.message}`);
        this.lastErrorLog = now;
      }
    } finally {
      this.isSyncing = false;
    }
  }

  // ============ SYNC ============
  async syncAllLogsFromDevice() {
    const end = new Date();
    end.setDate(end.getDate() + 1);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return this.sync(start, end);
  }

  async syncLogsFromDevice(options?: {
    startDate?: string;
    endDate?: string;
    daysBack?: number;
  }) {
    let start: Date;
    let end: Date;

    if (options?.startDate && options?.endDate) {
      start = new Date(options.startDate);
      end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
    } else if (options?.daysBack) {
      end = new Date();
      end.setDate(end.getDate() + 1);
      start = new Date();
      start.setDate(start.getDate() - options.daysBack);
    } else {
      start = new Date();
      end = new Date();
      end.setDate(end.getDate() + 1);
    }

    return this.sync(start, end);
  }

  private async sync(start: Date, end: Date) {
    const raw = await this.deviceProvider.device.fetchAllEvents(start, end);
    this.logger.log(`📊 Total eventos crudos: ${raw.length}`);

    const { records, ignored } = await this.parseEvents(raw);
    this.logger.log(`✅ Válidos: ${records.length} | Ignorados: ${ignored}`);

    const saved = await this.storage.saveNewRecords(records);
    if (saved > 0) this.lastSyncTime = new Date();
    this.logger.log(`💾 Nuevos guardados: ${saved}`);

    return {
      success: true,
      message: 'Sincronización completa',
      totalEventosEnBiometrico: raw.length,
      totalEventosValidos: records.length,
      totalEventosIgnorados: ignored,
      totalRegistrosNuevosGuardados: saved,
      empleadosUnicos: new Set(records.map((r) => r.employeeId)).size,
    };
  }

  private async parseEvents(rawEvents: any[]) {
    const records: AttendanceRecord[] = [];
    let ignored = 0;

    for (const ev of rawEvents) {
      const record = this.deviceProvider.device.parseEvent(ev);
      if (record) {
        record.employeeName = await this.deviceProvider.device.getEmployeeName(
          record.employeeId,
        );
        records.push(record);
      } else {
        ignored++;
      }
    }

    return { records, ignored };
  }

  // ============ MARCAJE MANUAL ============
  async insertAttendanceRecord(data: {
    employeeId: string;
    employeeName?: string;
    timestamp?: string | Date;
    deviceName?: string;
    rawType?: string;
  }) {
    try {
      const idStr = String(data.employeeId);
      if (!idStr || idStr.trim() === '' || idStr === '0') {
        throw new Error('El ID de empleado es obligatorio.');
      }

      const name =
        data.employeeName ||
        (await this.deviceProvider.device.getEmployeeName(idStr));

      const rawDate = data.timestamp
        ? new Date(data.timestamp).toISOString()
        : new Date().toISOString();

      const { dateObj, horaLocal } = this.parseDeviceTime(rawDate);
      const rawCode = data.rawType || '38';
      const device = data.deviceName || 'SISTEMA_MANUAL';

      const record: AttendanceRecord = {
        employeeId: idStr,
        employeeName: name,
        timestamp: dateObj,
        horaLocal,
        deviceName: device,
        rawType: rawCode,
      };

      const added = await this.storage.saveNewRecords([record]);

      return {
        success: added > 0,
        message:
          added > 0
            ? 'Marcaje registrado exitosamente.'
            : 'El marcaje ya existe.',
        data:
          added > 0
            ? {
                empleadoId: record.employeeId,
                nombre: record.employeeName,
                horaLocal: record.horaLocal,
                metodoMarcaje: rawCode,
                dispositivo: record.deviceName,
              }
            : null,
      };
    } catch (error: any) {
      this.logger.error('Error al insertar marcaje:', error?.message || error);
      return {
        success: false,
        message: 'No se pudo guardar el marcaje.',
        error: error?.message || String(error),
      };
    }
  }

  // ============ WEBHOOK ============
  async processEventPayload(body: any, contentType?: string): Promise<boolean> {
    try {
      let parsedData: any = body;

      if (typeof body === 'string' || contentType?.includes('xml')) {
        parsedData = await this.parseXml(body);
      }

      const record = this.extractAttendanceData(parsedData);
      if (!record) return false;

      record.employeeName = await this.deviceProvider.device.getEmployeeName(
        record.employeeId,
      );
      const added = await this.storage.saveNewRecords([record]);
      return added > 0;
    } catch (error) {
      this.logger.error('Error procesando evento PUSH:', error);
      return false;
    }
  }

  private extractAttendanceData(payload: any): AttendanceRecord | null {
    const event =
      payload?.AccessControllerEvent ||
      payload?.EventNotificationAlert?.AccessControllerEvent;
    if (!event) return null;

    // ✅ Usar los nombres REALES del XML de Hikvision
    const majorEventType = Number(event.majorEventType);
    const subEventType = Number(event.subEventType);
    const systemEventMinors = [49, 50, 51, 52, 53, 54, 55];

    if (systemEventMinors.includes(subEventType)) return null;
    if (majorEventType !== 5) return null;

    const employeeId = event.employeeNoString || event.employeeNo;
    if (!employeeId || String(employeeId).trim() === '' || employeeId === '0') {
      return null;
    }

    // ✅ El dateTime viene en EventNotificationAlert (raíz) o en event.time
    const timeStr =
      payload?.EventNotificationAlert?.dateTime ||
      payload?.dateTime ||
      event.time;

    const deviceName = event.deviceName || 'HIKVISION_DS-K1A8503MF';
    if (!timeStr) return null;

    const { dateObj, horaLocal } = this.parseDeviceTime(timeStr);

    return {
      employeeId: String(employeeId),
      timestamp: dateObj,
      horaLocal,
      deviceName,
      rawType: String(event.subEventType || 'AccessControl'),
    };
  }

  private parseDeviceTime(timeStr: string) {
    // ✅ FIX: mantener el timezone si viene en el string
    // Ej: '2026-09-21T19:07:39-04:00' → se interpreta correctamente
    const dateObj = new Date(timeStr);

    // Verificar que no sea Invalid Date
    if (isNaN(dateObj.getTime())) {
      // Fallback: asumir UTC sin timezone
      const clean = timeStr.replace(/[+-]\d{2}:\d{2}$/, '');
      const fallback = new Date(clean + 'Z');
      const horaLocalFallback = new Intl.DateTimeFormat('es-VE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'America/Caracas',
      }).format(fallback);
      return { dateObj: fallback, horaLocal: horaLocalFallback };
    }

    const horaLocal = new Intl.DateTimeFormat('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'America/Caracas',
    }).format(dateObj);

    return { dateObj, horaLocal };
  }

  private parseXml(xmlString: string): Promise<any> {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xmlString, { explicitArray: false }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}