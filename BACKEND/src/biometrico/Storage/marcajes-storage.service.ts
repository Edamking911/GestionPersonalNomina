import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Workbook } from 'exceljs';
import { AttendanceRecord } from '../Interfaces/biometrico-device.interface';
import { parseEventType, delay } from '../Utils/Events-types.util';

@Injectable()
export class MarcajesStorageService {
  private readonly logger = new Logger(MarcajesStorageService.name);
  private readonly filePath = path.join(process.cwd(), 'marcajes.json');
  private readonly excelFilePath = path.join(process.cwd(), 'marcajes.xlsx');

  getSavedEvents(): AttendanceRecord[] {
    if (!fs.existsSync(this.filePath)) return [];
    const data = fs.readFileSync(this.filePath, 'utf-8');
    if (!data) return [];
    try {
      return JSON.parse(data).map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
      }));
    } catch (error) {
      this.logger.error('Error parseando marcajes.json:', error);
      return [];
    }
  }

  async saveNewRecords(records: AttendanceRecord[]): Promise<number> {
    if (records.length === 0) return 0;
    const current = this.getSavedEvents();

    const existingKeys = new Set(
      current.map(
        (e) => `${e.employeeId}_${new Date(e.timestamp).toISOString()}`,
      ),
    );

    const recordsToAdd: AttendanceRecord[] = [];
    for (const record of records) {
      const key = `${record.employeeId}_${new Date(record.timestamp).toISOString()}`;
      if (!existingKeys.has(key)) {
        recordsToAdd.push(record);
        existingKeys.add(key);
      }
    }

    if (recordsToAdd.length === 0) return 0;

    const updated = [...current, ...recordsToAdd].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    fs.writeFileSync(this.filePath, JSON.stringify(updated, null, 2), 'utf-8');

    try {
      await this.regenerateExcel(updated);
    } catch (error: any) {
      this.logger.warn(
        `⚠️ No se pudo actualizar Excel (JSON sí se guardó): ${error.message}`,
      );
    }

    this.logger.log(`📊 ${recordsToAdd.length} registros nuevos guardados`);
    return recordsToAdd.length;
  }

  async cleanDuplicates() {
    const events = this.getSavedEvents();
    const unique = new Map<string, AttendanceRecord>();
    let removed = 0;

    for (const event of events) {
      const key = `${event.employeeId}_${new Date(event.timestamp).toISOString()}`;
      if (!unique.has(key)) unique.set(key, event);
      else removed++;
    }

    const clean = Array.from(unique.values()).sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    fs.writeFileSync(this.filePath, JSON.stringify(clean, null, 2), 'utf-8');
    await this.regenerateExcel(clean);

    return {
      removed,
      message: `Se eliminaron ${removed} duplicados. Total: ${clean.length}`,
    };
  }

  async exportDetailedJson() {
    const events = this.getSavedEvents();
    const detailed = events.map((e) => ({
      empleadoId: e.employeeId,
      nombreCompleto: e.employeeName || 'DESCONOCIDO',
      metodoMarcaje: parseEventType(e.rawType),
      horaLocal: e.horaLocal,
      dispositivo: e.deviceName,
    }));

    const exportPath = path.join(process.cwd(), 'marcajes_con_nombres.json');
    fs.writeFileSync(exportPath, JSON.stringify(detailed, null, 2), 'utf-8');

    return {
      success: true,
      message: `Archivo exportado a ${exportPath}`,
      total: detailed.length,
      data: detailed,
    };
  }

  async checkExcelStatus() {
    if (!fs.existsSync(this.excelFilePath)) {
      return {
        success: false,
        message: 'El archivo Excel no existe todavía',
        path: this.excelFilePath,
      };
    }

    try {
      const stats = fs.statSync(this.excelFilePath);
      const workbook: any = new Workbook();
      await workbook.xlsx.readFile(this.excelFilePath);
      const worksheet: any = workbook.getWorksheet('Marcajes');

      if (!worksheet) {
        return { success: false, message: 'La hoja "Marcajes" no existe' };
      }

      const lastRows: any[] = [];
      const totalRows = worksheet.rowCount;
      const startRow = Math.max(2, totalRows - 4);
      for (let i = startRow; i <= totalRows; i++) {
        const row = worksheet.getRow(i);
        lastRows.push({
          fila: i,
          empleadoId: row.getCell(1).value?.toString() || '',
          nombre: row.getCell(2).value?.toString() || '',
          horaLocal: row.getCell(3).value?.toString() || '',
          metodoMarcaje: row.getCell(4).value?.toString() || '',
          dispositivo: row.getCell(5).value?.toString() || '',
        });
      }

      return {
        success: true,
        message: 'Excel verificado correctamente',
        path: this.excelFilePath,
        tamanoKB: (stats.size / 1024).toFixed(2),
        ultimaModificacion: stats.mtime,
        totalFilas: worksheet.rowCount - 1,
        columnas: worksheet.columnCount,
        ultimosRegistros: lastRows,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error al verificar el Excel',
        error: error.message,
      };
    }
  }

  private async regenerateExcel(records: AttendanceRecord[]): Promise<void> {
    const maxReintentos = 3;

    for (let intento = 1; intento <= maxReintentos; intento++) {
      try {
        const workbook: any = new Workbook();
        const worksheet: any = workbook.addWorksheet('Marcajes');

        worksheet.columns = [
          { header: 'ID / Cédula', key: 'employeeId', width: 15 },
          { header: 'Nombre del Empleado', key: 'employeeName', width: 30 },
          { header: 'Fecha y Hora Local', key: 'horaLocal', width: 25 },
          { header: 'Método de Marcaje', key: 'metodoMarcaje', width: 22 },
          { header: 'Dispositivo', key: 'deviceName', width: 20 },
        ];

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '004080' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        const sorted = [...records].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        for (const record of sorted) {
          worksheet.addRow({
            employeeId: record.employeeId,
            employeeName: record.employeeName || 'DESCONOCIDO',
            horaLocal: record.horaLocal,
            metodoMarcaje: parseEventType(record.rawType),
            deviceName: record.deviceName,
          });
        }

        await workbook.xlsx.writeFile(this.excelFilePath);
        this.logger.log(`📊 Excel regenerado con ${sorted.length} registros`);
        return;
      } catch (error: any) {
        if (error.code === 'EBUSY' || error.message?.includes('EBUSY')) {
          if (intento < maxReintentos) {
            this.logger.warn(
              `⚠️ Excel abierto (intento ${intento}/${maxReintentos}). Reintentando en 2s...`,
            );
            await delay(2000);
            continue;
          }
          this.logger.error(
            '❌ No se pudo escribir el Excel: está abierto. Ciérralo para que se actualice.',
          );
          return;
        }
        this.logger.error('Error inesperado al escribir Excel:', error.message);
        throw error;
      }
    }
  }

  async refreshEmployeeNames(nameResolver: (employeeId: string) => Promise<string>): Promise<{ actualizados: number; total: number; errores: string[] }> {
    const events = this.getSavedEvents();
    if (events.length === 0) {
        return { actualizados: 0, total: 0, errores: [] };
    }

    // 1. Obtener todos los IDs únicos
    const uniqueIds = [...new Set(events.map((e) => e.employeeId))];
    this.logger.log(`🔄 Refrescando nombres de ${uniqueIds.length} empleados...`);

    // 2. Resolver el nombre actual de cada uno
    const nameMap = new Map<string, string>();
    const errores: string[] = [];

    for (const id of uniqueIds) {
        try {
        const name = await nameResolver(id);
        if (name && name !== 'DESCONOCIDO') {
            nameMap.set(id, name);
        }
        } catch (error: any) {
        errores.push(`${id}: ${error.message}`);
        }
    }

    // 3. Actualizar los registros
    let actualizados = 0;
    for (const event of events) {
        const nombreActual = nameMap.get(event.employeeId);
        if (nombreActual && event.employeeName !== nombreActual) {
        event.employeeName = nombreActual;
        actualizados++;
        }
    }

    // 4. Guardar JSON
    fs.writeFileSync(this.filePath, JSON.stringify(events, null, 2), 'utf-8');

    // 5. Regenerar Excel
    try {
        await this.regenerateExcel(events);
    } catch (error: any) {
        this.logger.warn(`⚠️ Excel no actualizado: ${error.message}`);
    }

    this.logger.log(
        `✅ ${actualizados} nombres actualizados de ${events.length} registros`,
    );

    return {
        actualizados,
        total: events.length,
        errores,
    };
  }
}