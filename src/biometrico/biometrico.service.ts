import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import * as util from 'util';
import * as xml2js from 'xml2js';
import * as fs from 'fs';
import * as path from 'path';
import * as Workbook from 'exceljs';

const execPromise = util.promisify(exec);

export interface AttendanceRecord {
  employeeId: string;
  employeeName?: string;
  timestamp: Date;
  horaLocal?: string;
  deviceName: string;
  rawType: string;
}

@Injectable()
export class BiometricoService {
  private readonly logger = new Logger(BiometricoService.name);
  private readonly filePath = path.join(process.cwd(), 'marcajes.json');
  private readonly excelFilePath = path.join(process.cwd(), 'marcajes.xlsx');
  private readonly timeZone = 'America/Caracas';
  private employeeMap = new Map<string, string>();

  private errorCount = 0;
  private lastErrorLog = 0;
  private isSyncing = false;
  private lastSyncTime: Date | null = null;

  // =========================================================
  // CRON JOB AUTOMÁTICO
  // =========================================================
  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleAutoSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const result = await this.syncAllLogsFromDevice();
      this.logger.log(`⏰ Cron: ${result.totalEventosValidos} eventos válidos, ${result.totalRegistrosNuevosGuardados} nuevos guardados`);
      this.errorCount = 0;
    } catch (error: any) {
      const now = Date.now();
      if (now - this.lastErrorLog > 60000) {
        this.errorCount++;
        this.logger.warn(`⚠️ Error (Intento #${this.errorCount}): ${error.message}`);
        this.lastErrorLog = now;
      }
    } finally {
      this.isSyncing = false;
    }
  }

  // =========================================================
  // SINCRONIZACIÓN DE MARCAJES
  // =========================================================
  async syncAllLogsFromDevice(
    ip = '172.18.0.89',
    user = 'admin',
    pass = 'Dtd2026*',
  ) {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const formatDate = (date: Date, isStart: boolean) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const time = isStart ? '00:00:00' : '23:59:59';
        return `${year}-${month}-${day}T${time}+08:00`;
      };

      const startTime = formatDate(startDate, true);
      const endTime = formatDate(endDate, false);

      this.logger.log(`📅 Buscando desde ${startTime} hasta ${endTime}`);

      let allEvents: any[] = [];
      let searchResultPosition = 0;
      const maxResultsPerPage = 100;
      let totalMatches = 0;
      let hasMoreData = true;

      while (hasMoreData) {
        const payloadObj = {
          AcsEventCond: {
            searchID: '1',
            searchResultPosition: searchResultPosition,
            maxResults: maxResultsPerPage,
            major: 0,
            minor: 0,
            startTime: startTime,
            endTime: endTime,
          },
        };

        const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
        const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X POST -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/AcsEvent?format=json`;

        const { stdout } = await execPromise(command, { timeout: 30000, maxBuffer: 1024 * 1024 * 50 });
        if (!stdout) throw new Error('Sin respuesta del biométrico');

        const data = JSON.parse(stdout);
        const events = data?.AcsEvent?.InfoList || [];
        totalMatches = data?.AcsEvent?.totalMatches || 0;

        if (events.length > 0) {
          allEvents = allEvents.concat(events);
          searchResultPosition += events.length;
          if (allEvents.length >= totalMatches) hasMoreData = false;
        } else {
          hasMoreData = false;
        }

        if (hasMoreData) await this.delay(300);
      }

      this.logger.log(`📊 Total eventos: ${allEvents.length}`);

      const validRecords: AttendanceRecord[] = [];
      let ignoredSystemEvents = 0;
      let ignoredEmptyEmployee = 0;
      let ignoredInvalidMajor = 0;

      for (const ev of allEvents) {
        const minor = Number(ev.minor);
        const major = Number(ev.major);
        const systemEventMinors = [49, 50, 51, 52, 53, 54, 55];
        if (systemEventMinors.includes(minor)) { ignoredSystemEvents++; continue; }
        if (major !== 5) { ignoredInvalidMajor++; continue; }

        const empId = ev.employeeNoString || ev.employeeNo || ev.cardNo;
        if (!empId || String(empId).trim() === '' || empId === '0') { ignoredEmptyEmployee++; continue; }

        const idStr = String(empId);
        const name = await this.getEmployeeName(idStr, ip, user, pass);
        const { dateObj, horaLocal } = this.parseDeviceTimeToLocal(ev.time);

        validRecords.push({
          employeeId: idStr,
          employeeName: name,
          timestamp: dateObj,
          horaLocal,
          deviceName: ev.deviceName || 'DS-K1A8503MF',
          rawType: String(minor || ev.eventType || '38'),
        });
      }

      this.logger.log(`✅ Eventos válidos: ${validRecords.length} | Sistema: ${ignoredSystemEvents} | Sin empleado: ${ignoredEmptyEmployee} | Major inválido: ${ignoredInvalidMajor}`);

      let newRecordsAdded = 0;
      if (validRecords.length > 0) {
        newRecordsAdded = await this.saveMultipleRecords(validRecords);
        this.lastSyncTime = new Date();
      }

      this.logger.log(`💾 Registros nuevos guardados: ${newRecordsAdded}`);

      return {
        success: true,
        message: 'Sincronización completa',
        totalEventosEnBiometrico: allEvents.length,
        totalEventosValidos: validRecords.length,
        totalRegistrosNuevosGuardados: newRecordsAdded,
        totalEventosSistemaIgnorados: ignoredSystemEvents,
        totalSinEmpleadoIgnorados: ignoredEmptyEmployee,
        totalMajorInvalidoIgnorados: ignoredInvalidMajor,
        empleadosUnicos: [...new Set(validRecords.map(v => v.employeeId))].length,
      };
    } catch (error: any) {
      this.logger.error('Error al sincronizar:', error?.message || error);
      throw error;
    }
  }

  async syncLogsFromDevice(
    ip = '172.18.0.89',
    user = 'admin',
    pass = 'Dtd2026*',
    options?: { startDate?: string; endDate?: string; daysBack?: number },
  ) {
    try {
      let startDate: Date;
      let endDate: Date;
      if (options?.startDate && options?.endDate) {
        startDate = new Date(options.startDate);
        endDate = new Date(options.endDate);
      } else if (options?.daysBack) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);
        startDate = new Date();
        startDate.setDate(startDate.getDate() - options.daysBack);
      } else {
        startDate = new Date();
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);
      }

      const formatDate = (date: Date, isStart: boolean) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const time = isStart ? '00:00:00' : '23:59:59';
        return `${year}-${month}-${day}T${time}+08:00`;
      };
      const startTime = formatDate(startDate, true);
      const endTime = formatDate(endDate, false);

      const payloadObj = {
        AcsEventCond: {
          searchID: '1',
          searchResultPosition: 0,
          maxResults: 500,
          major: 0,
          minor: 0,
          startTime: startTime,
          endTime: endTime,
        },
      };
      const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
      const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X POST -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/AcsEvent?format=json`;

      const { stdout } = await execPromise(command, { timeout: 30000, maxBuffer: 1024 * 1024 * 50 });
      if (!stdout) throw new Error('Sin respuesta del biométrico');

      const data = JSON.parse(stdout);
      const events = data?.AcsEvent?.InfoList || [];

      const validRecords: AttendanceRecord[] = [];
      let ignoredSystemEvents = 0;
      let ignoredEmptyEmployee = 0;
      let ignoredInvalidMajor = 0;

      for (const ev of events) {
        const minor = Number(ev.minor);
        const major = Number(ev.major);
        const systemEventMinors = [49, 50, 51, 52, 53, 54, 55];
        if (systemEventMinors.includes(minor)) { ignoredSystemEvents++; continue; }
        if (major !== 5) { ignoredInvalidMajor++; continue; }
        const empId = ev.employeeNoString || ev.employeeNo || ev.cardNo;
        if (!empId || String(empId).trim() === '' || empId === '0') { ignoredEmptyEmployee++; continue; }

        const idStr = String(empId);
        const name = await this.getEmployeeName(idStr, ip, user, pass);
        const { dateObj, horaLocal } = this.parseDeviceTimeToLocal(ev.time);

        validRecords.push({
          employeeId: idStr,
          employeeName: name,
          timestamp: dateObj,
          horaLocal,
          deviceName: ev.deviceName || 'DS-K1A8503MF',
          rawType: String(minor || ev.eventType || '38'),
        });
      }

      let newRecordsAdded = 0;
      if (validRecords.length > 0) {
        newRecordsAdded = await this.saveMultipleRecords(validRecords);
      }

      return {
        success: true,
        message: 'Sincronización completada',
        totalEncontradosEnBiometrico: events.length,
        totalEventosValidos: validRecords.length,
        totalRegistrosNuevosGuardados: newRecordsAdded,
        totalEventosSistemaIgnorados: ignoredSystemEvents,
        totalSinEmpleadoIgnorados: ignoredEmptyEmployee,
        totalMajorInvalidoIgnorados: ignoredInvalidMajor,
        empleadosUnicos: [...new Set(validRecords.map(v => v.employeeId))].length,
      };
    } catch (error: any) {
      this.logger.error('Error al sincronizar:', error?.message || error);
      throw error;
    }
  }

  // =========================================================
  // GESTIÓN DE USUARIOS
  // =========================================================

  async listUsers(
    ip = '172.18.0.89',
    user = 'admin',
    pass = 'Dtd2026*',
    incluirInactivos = false,
  ) {
    const maxResults = 100;
    let searchResultPosition = 0;
    let totalMatches = 0;
    let todosUsuarios: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const payloadObj = {
        UserInfoSearchCond: {
          searchID: '1',
          searchResultPosition: searchResultPosition,
          maxResults: maxResults,
        },
      };

      const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
      const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X POST -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Search?format=json`;

      const { stdout } = await execPromise(command, { timeout: 10000 });
      const data = JSON.parse(stdout);

      const usuarios = data?.UserInfoSearch?.UserInfo || [];
      totalMatches = data?.UserInfoSearch?.totalMatches || 0;

      todosUsuarios = todosUsuarios.concat(usuarios);
      searchResultPosition += usuarios.length;

      if (todosUsuarios.length >= totalMatches || usuarios.length === 0) {
        hasMore = false;
      }
    }

    let usuariosFiltrados = todosUsuarios;
    if (!incluirInactivos) {
      usuariosFiltrados = todosUsuarios.filter(u => u.Valid?.enable !== false);
    }

    return {
      success: true,
      totalUsuarios: usuariosFiltrados.length,
      usuarios: usuariosFiltrados.map(u => ({
        employeeNo: u.employeeNo,
        name: u.name,
        userType: u.userType,
        userGroup: u.userGroup || '',
        activo: u.Valid?.enable !== false,
      })),
    };
  }

  async importUsersFromExcel(
    excelPath: string,
    ip = '172.18.0.89',
    user = 'admin',
    pass = 'Dtd2026*',
  ) {
    const workbook: any = new Workbook.Workbook();
    try {
      await workbook.xlsx.readFile(excelPath);
      const worksheet: any = workbook.getWorksheet(1);
      if (!worksheet) throw new Error('No se encontró la hoja en el Excel');

      this.logger.log(`📄 Leyendo usuarios desde: ${excelPath}`);

      const resultados = {
        totalFilas: 0,
        creados: 0,
        actualizados: 0,
        fallidos: 0,
        errores: [] as string[],
      };

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        let cedula = row.getCell(1).value?.toString().trim() || '';
        cedula = cedula.replace(/[^0-9]/g, '');
        const nombre = row.getCell(2).value?.toString().trim() || '';
        const apellido = row.getCell(3).value?.toString().trim() || '';
        const cargo = row.getCell(4).value?.toString().trim() || 'EMPLEADO';

        if (!cedula) continue;

        resultados.totalFilas++;
        const nombreCompleto = `${nombre} ${apellido}`.trim();
        const userType = cargo.toLowerCase().includes('admin') ? 'admin' : 'normal';

        const fechaActual = new Date();
        const fechaFin = new Date();
        fechaFin.setFullYear(fechaFin.getFullYear() + 10);

        const payloadObj = {
          UserInfo: {
            employeeNo: cedula,
            name: nombreCompleto,
            userType: userType,
            userGroup: cargo,
            doorRight: '1',
            Valid: {
              enable: true,
              beginTime: fechaActual.toISOString().slice(0, 19),
              endTime: fechaFin.toISOString().slice(0, 19),
            },
          },
        };

        const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');

        const createCommand = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X POST -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Record?format=json`;

        try {
          const { stdout } = await execPromise(createCommand, { timeout: 10000 });
          const response = JSON.parse(stdout);

          if (response?.statusCode === 1 || response?.statusString === 'OK') {
            resultados.creados++;
            this.logger.log(`✅ Usuario creado: ${cedula} - ${nombreCompleto} (${cargo})`);
          } else if (response?.subStatusCode === 'deviceUserAlreadyExist') {
            const updateCommand = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X PUT -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Modify?format=json`;
            const { stdout: updateStdout } = await execPromise(updateCommand, { timeout: 10000 });
            const updateResponse = JSON.parse(updateStdout);

            if (updateResponse?.statusCode === 1 || updateResponse?.statusString === 'OK') {
              resultados.actualizados++;
              this.logger.log(`🔄 Usuario actualizado: ${cedula} - ${nombreCompleto}`);
            } else {
              resultados.fallidos++;
              resultados.errores.push(`Error actualizando ${cedula}: ${JSON.stringify(updateResponse)}`);
            }
          } else {
            resultados.fallidos++;
            resultados.errores.push(`Error con ${cedula}: ${JSON.stringify(response)}`);
          }
        } catch (error: any) {
          resultados.fallidos++;
          resultados.errores.push(`Error con ${cedula}: ${error.message}`);
        }

        await this.delay(200);
      }

      this.logger.log(`📊 Importación: ${resultados.creados} creados, ${resultados.actualizados} actualizados, ${resultados.fallidos} fallidos`);
      return { success: true, message: 'Importación masiva completada', ...resultados };
    } catch (error: any) {
      this.logger.error('Error en importación masiva:', error.message);
      return { success: false, message: 'Error al importar usuarios', error: error.message };
    }
  }

  async deleteUserFromDevice(
    employeeNo: string,
    ip = '172.18.0.89',
    user = 'admin',
    pass = 'Dtd2026*',
  ) {
    try {
      const currentUser = await this.getUserByEmployeeNo(employeeNo, ip, user, pass);
      const nombreActual = currentUser?.name || 'DESCONOCIDO';
      const userTypeActual = currentUser?.userType || 'normal';

      const payloadObj = {
        UserInfo: {
          employeeNo: employeeNo,
          name: nombreActual,
          userType: userTypeActual,
          Valid: {
            enable: false,
            beginTime: '2026-01-01T00:00:00',
            endTime: '2036-01-01T23:59:59',
          },
        },
      };

      const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
      const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X PUT -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Modify?format=json`;

      const { stdout } = await execPromise(command, { timeout: 10000 });
      const response = JSON.parse(stdout);

      if (response?.statusCode === 1 || response?.statusString === 'OK') {
        this.logger.log(`✅ Usuario ${employeeNo} desactivado correctamente`);
        return { success: true, message: `Usuario ${employeeNo} desactivado (no podrá marcar)` };
      } else {
        this.logger.warn(`⚠️ No se pudo desactivar ${employeeNo}: ${JSON.stringify(response)}`);
        return { success: false, message: 'No se pudo desactivar el usuario', detail: response };
      }
    } catch (error: any) {
      this.logger.error(`Error desactivando ${employeeNo}: ${error.message}`);
      return { success: false, message: 'Error al desactivar el usuario', error: error.message };
    }
  }

  async prepareUserForFingerprint(
    employeeNo: string,
    ip = '172.18.0.89',
    user = 'admin',
    pass = 'Dtd2026*',
  ) {
    try {
      const currentUser = await this.getUserByEmployeeNo(employeeNo, ip, user, pass);
      if (!currentUser) {
        return { success: false, message: 'Usuario no encontrado en el biométrico' };
      }

      const payloadObj = {
        UserInfo: {
          employeeNo: employeeNo,
          name: currentUser.name || 'DESCONOCIDO',
          userType: currentUser.userType || 'normal',
          Valid: {
            enable: true,
            beginTime: '2026-01-01T00:00:00',
            endTime: '2036-01-01T23:59:59',
          },
        },
      };

      const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
      const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X PUT -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Modify?format=json`;

      const { stdout } = await execPromise(command, { timeout: 10000 });
      const response = JSON.parse(stdout);

      if (response?.statusCode === 1 || response?.statusString === 'OK') {
        this.addToPendingFingerprintList(employeeNo);
        return { success: true, message: `Usuario ${employeeNo} activado y listo para registrar huella` };
      } else {
        return { success: false, message: 'No se pudo activar al usuario', detail: response };
      }
    } catch (error: any) {
      return { success: false, message: 'Error al preparar usuario', error: error.message };
    }
  }

  async listPendingFingerprint() {
    const pendingPath = path.join(process.cwd(), 'pendientes_huella.json');
    if (!fs.existsSync(pendingPath)) return [];
    return JSON.parse(fs.readFileSync(pendingPath, 'utf-8'));
  }

  removeFromPendingFingerprintList(employeeNo: string) {
    const pendingPath = path.join(process.cwd(), 'pendientes_huella.json');
    if (!fs.existsSync(pendingPath)) return { success: true, message: 'No hay pendientes' };
    let pendientes = JSON.parse(fs.readFileSync(pendingPath, 'utf-8'));
    const nuevos = pendientes.filter(p => p !== employeeNo);
    fs.writeFileSync(pendingPath, JSON.stringify(nuevos, null, 2));
    return { success: true, message: `Usuario ${employeeNo} eliminado de pendientes` };
  }

  private addToPendingFingerprintList(employeeNo: string) {
    const pendingPath = path.join(process.cwd(), 'pendientes_huella.json');
    let pendientes: string[] = [];
    if (fs.existsSync(pendingPath)) pendientes = JSON.parse(fs.readFileSync(pendingPath, 'utf-8'));
    if (!pendientes.includes(employeeNo)) {
      pendientes.push(employeeNo);
      fs.writeFileSync(pendingPath, JSON.stringify(pendientes, null, 2));
    }
  }

  private async getUserByEmployeeNo(employeeNo: string, ip: string, user: string, pass: string) {
    const payloadObj = {
      UserInfoSearchCond: {
        searchID: '1',
        searchResultPosition: 0,
        maxResults: 1,
        EmployeeNoList: [{ employeeNo }],
      },
    };
    const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
    const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X POST -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Search?format=json`;
    const { stdout } = await execPromise(command, { timeout: 10000 });
    const data = JSON.parse(stdout);
    return data?.UserInfoSearch?.UserInfo?.[0] || null;
  }

  async obtenerHoraBiometrico(): Promise<Date> {
    try {
      const command = `curl --digest -u admin:Dtd2026* http://172.18.0.89/ISAPI/System/deviceInfo`;
      const { stdout } = await execPromise(command, { timeout: 5000 });
      const parsed = await this.parseXml(stdout);
      const deviceTime = parsed?.DeviceInfo?.deviceTime || parsed?.DeviceInfo?.DateTime;
      if (deviceTime) {
        return new Date(deviceTime);
      }
    } catch (error) {
      this.logger.warn('No se pudo obtener hora del biométrico, se usará hora local');
    }
    return new Date();
  }

  // =========================================================
  // UTILIDADES DE MARCAJES Y EXCEL
  // =========================================================

  getSavedEvents(): AttendanceRecord[] {
    if (!fs.existsSync(this.filePath)) return [];
    const fileData = fs.readFileSync(this.filePath, 'utf-8');
    if (!fileData) return [];
    try {
      const records = JSON.parse(fileData);
      return records.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
      }));
    } catch (error) {
      this.logger.error('Error parseando marcajes.json:', error);
      return [];
    }
  }

  getFormattedEvents(employeeIdFilter?: string) {
    if (!fs.existsSync(this.filePath)) {
      return { totalRecords: 0, events: [] };
    }
    const fileData = fs.readFileSync(this.filePath, 'utf-8');
    let records: AttendanceRecord[] = fileData ? JSON.parse(fileData) : [];

    if (employeeIdFilter) {
      records = records.filter(r => r.employeeId === employeeIdFilter);
    }

    const formattedEvents = records
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(r => ({
        empleadoId: r.employeeId,
        nombre: r.employeeName || 'DESCONOCIDO',
        metodoMarcaje: this.parseEventType(r.rawType),
        horaLocal: r.horaLocal,
        timestampISO: r.timestamp,
        dispositivo: r.deviceName,
      }));

    return { totalRecords: formattedEvents.length, events: formattedEvents };
  }

  getStats() {
    const events = this.getSavedEvents();

    const byDay: any = {};
    events.forEach(e => {
      const timestamp = new Date(e.timestamp);
      const day = timestamp.toLocaleDateString('es-VE');
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(e);
    });

    const byEmployee: any = {};
    events.forEach(e => {
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
      registrosPorDia: Object.keys(byDay).map(day => ({
        fecha: day,
        total: byDay[day].length,
        empleadosUnicos: [...new Set(byDay[day].map((e: any) => e.employeeId))].length,
      })),
      resumenPorEmpleado: Object.keys(byEmployee).map(id => ({
        empleadoId: id,
        ...byEmployee[id],
      })),
    };
  }

  async checkExcelStatus() {
    if (!fs.existsSync(this.excelFilePath)) {
      return { success: false, message: 'El archivo Excel no existe todavía', path: this.excelFilePath };
    }
    try {
      const stats = fs.statSync(this.excelFilePath);
      const workbook: any = new Workbook.Workbook();
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
      return { success: false, message: 'Error al verificar el Excel', error: error.message };
    }
  }

  async exportDetailedJson() {
    const events = this.getSavedEvents();
    const detailed = events.map(e => ({
      empleadoId: e.employeeId,
      nombreCompleto: e.employeeName || 'DESCONOCIDO',
      metodoMarcaje: this.parseEventType(e.rawType),
      horaLocal: e.horaLocal,
      dispositivo: e.deviceName,
    }));

    const exportPath = path.join(process.cwd(), 'marcajes_con_nombres.json');
    fs.writeFileSync(exportPath, JSON.stringify(detailed, null, 2), 'utf-8');
    return { success: true, message: `Archivo exportado a ${exportPath}`, total: detailed.length, data: detailed };
  }

  async cleanDuplicates() {
    const events = this.getSavedEvents();
    const uniqueEvents = new Map<string, AttendanceRecord>();
    let removed = 0;

    for (const event of events) {
      const key = `${event.employeeId}_${new Date(event.timestamp).toISOString()}`;
      if (!uniqueEvents.has(key)) {
        uniqueEvents.set(key, event);
      } else {
        removed++;
      }
    }

    const cleanEvents = Array.from(uniqueEvents.values());
    cleanEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    fs.writeFileSync(this.filePath, JSON.stringify(cleanEvents, null, 2), 'utf-8');
    await this.regenerateExcel(cleanEvents);

    return { removed, message: `Se eliminaron ${removed} duplicados. Total: ${cleanEvents.length}` };
  }

  private async regenerateExcel(records: AttendanceRecord[]) {
    const workbook: any = new Workbook.Workbook();
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
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    const sortedRecords = records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (const record of sortedRecords) {
      worksheet.addRow({
        employeeId: record.employeeId,
        employeeName: record.employeeName || 'DESCONOCIDO',
        horaLocal: record.horaLocal,
        metodoMarcaje: this.parseEventType(record.rawType),
        deviceName: record.deviceName,
      });
    }

    await workbook.xlsx.writeFile(this.excelFilePath);
    this.logger.log(`📊 Excel regenerado con ${sortedRecords.length} registros`);
  }

  private async saveMultipleRecords(records: AttendanceRecord[]): Promise<number> {
    if (records.length === 0) return 0;
    const currentEvents = this.getSavedEvents();

    const existingKeys = new Set(
      currentEvents.map(e => `${e.employeeId}_${new Date(e.timestamp).toISOString()}`),
    );

    let newRecordsCount = 0;
    const recordsToAdd: AttendanceRecord[] = [];

    for (const record of records) {
      const key = `${record.employeeId}_${new Date(record.timestamp).toISOString()}`;
      if (!existingKeys.has(key)) {
        recordsToAdd.push(record);
        existingKeys.add(key);
        newRecordsCount++;
      }
    }

    if (recordsToAdd.length > 0) {
      const updatedEvents = [...currentEvents, ...recordsToAdd];
      updatedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      fs.writeFileSync(this.filePath, JSON.stringify(updatedEvents, null, 2), 'utf-8');
      await this.regenerateExcel(updatedEvents);
    }

    return newRecordsCount;
  }

  parseEventType(rawType: string): string {
    const typeMap: Record<string, string> = {
      '1': 'Tarjeta RFID',
      '2': 'Contraseña/PIN',
      '38': 'Huella Dactilar',
      '75': 'Apertura por Software',
      '155': 'Huella Dactilar',
      '160': 'Huella Dactilar',
    };
    return typeMap[rawType] || 'Huella Dactilar';
  }

  private parseDeviceTimeToLocal(timeStr: string): { dateObj: Date; horaLocal: string } {
    const timeWithoutZone = timeStr.replace(/[+-]\d{2}:\d{2}$/, '');
    const dateObj = new Date(timeWithoutZone);

    const horaLocal = new Intl.DateTimeFormat('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(dateObj);

    return { dateObj, horaLocal };
  }

  async getEmployeeName(employeeId: string, ip = '172.18.0.89', user = 'admin', pass = 'Dtd2026*'): Promise<string> {
    if (!employeeId || employeeId === '0') return 'DESCONOCIDO';
    if (this.employeeMap.has(employeeId)) return this.employeeMap.get(employeeId)!;

    try {
      const payloadObj = {
        UserInfoSearchCond: {
          searchID: '1',
          searchResultPosition: 0,
          maxResults: 1,
          EmployeeNoList: [{ employeeNo: employeeId }],
        },
      };
      const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
      const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X POST -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Search?format=json`;

      const { stdout } = await execPromise(command, { timeout: 10000 });
      if (stdout) {
        const data = JSON.parse(stdout);
        const userInfo = data?.UserInfoSearch?.UserInfo?.[0];
        const name = userInfo?.name || 'DESCONOCIDO';
        this.employeeMap.set(employeeId, name);
        return name;
      }
    } catch (error: any) {
      this.logger.error(`Error obteniendo nombre para ${employeeId}:`, error.message);
    }
    return 'DESCONOCIDO';
  }

  private parseXml(xmlString: string): Promise<any> {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xmlString, { explicitArray: false }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearEmployeeCache() {
    this.employeeMap.clear();
    this.logger.log('🧹 Caché de empleados limpiada');
  }

  getAllRecordsOrderedByDate() {
    const events = this.getSavedEvents();
    const sortedEvents = events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const grouped: any = {};
    sortedEvents.forEach(record => {
      const timestamp = new Date(record.timestamp);
      const dateKey = timestamp.toLocaleDateString('es-VE');
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          fecha: timestamp.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
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
        metodoMarcaje: this.parseEventType(record.rawType),
        dispositivo: record.deviceName,
      });
    });

    const sortedDates = Object.keys(grouped).sort();
    return {
      totalRegistros: sortedEvents.length,
      totalDias: sortedDates.length,
      registrosPorFecha: sortedDates.map(key => ({
        fecha: grouped[key].fecha,
        totalMarcajes: grouped[key].totalMarcajes,
        marcajes: grouped[key].marcajes,
      })),
    };
  }

  async getMarcajesPorFecha(fechaStr: string) {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);

    const eventos = this.getSavedEvents();

    const marcajesDia = eventos.filter(ev => {
      const d = new Date(ev.timestamp);
      return d.toLocaleDateString('es-VE') === fecha.toLocaleDateString('es-VE');
    });

    marcajesDia.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      success: true,
      fecha: fecha.toLocaleDateString('es-VE'),
      totalMarcajes: marcajesDia.length,
      marcajes: marcajesDia.map(ev => ({
        employeeId: ev.employeeId,
        nombre: ev.employeeName || 'DESCONOCIDO',
        hora: ev.horaLocal,
        timestamp: ev.timestamp,
        metodoMarcaje: this.parseEventType(ev.rawType),
        dispositivo: ev.deviceName,
      })),
    };
  }

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

      const name = data.employeeName || (await this.getEmployeeName(idStr));
      const rawDate = data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString();
      const { dateObj, horaLocal } = this.parseDeviceTimeToLocal(rawDate);
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

      const added = await this.saveMultipleRecords([record]);

      return {
        success: added > 0,
        message: added > 0 ? 'Marcaje registrado exitosamente.' : 'El marcaje ya existe.',
        data: added > 0 ? {
          empleadoId: record.employeeId,
          nombre: record.employeeName,
          horaLocal: record.horaLocal,
          metodoMarcaje: this.parseEventType(record.rawType),
          dispositivo: record.deviceName,
        } : null,
      };
    } catch (error: any) {
      this.logger.error('Error al insertar marcaje:', error?.message || error);
      return { success: false, message: 'No se pudo guardar el marcaje.', error: error?.message || String(error) };
    }
  }

  async processEventPayload(body: any, contentType?: string): Promise<boolean> {
    try {
      let parsedData: any = body;

      if (typeof body === 'string' || contentType?.includes('xml')) {
        parsedData = await this.parseXml(body);
      }

      const record = this.extractAttendanceData(parsedData);

      if (record) {
        record.employeeName = await this.getEmployeeName(record.employeeId);
        const added = await this.saveMultipleRecords([record]);
        return added > 0;
      }

      return false;
    } catch (error) {
      this.logger.error('Error procesando evento PUSH:', error);
      return false;
    }
  }

  async getDeviceInfo(
    ip: string = '172.18.0.89',
    user: string = 'admin',
    pass: string = 'Dtd2026*',
  ) {
    try {
      const command = `curl --digest -u ${user}:${pass} http://${ip}/ISAPI/System/deviceInfo`;
      const { stdout } = await execPromise(command, { timeout: 10000 });

      const parsed = await this.parseXml(stdout);

      return {
        success: true,
        deviceInfo: {
          deviceName: parsed?.DeviceInfo?.deviceName || 'N/A',
          model: parsed?.DeviceInfo?.model || 'N/A',
          serialNumber: parsed?.DeviceInfo?.serialNumber || 'N/A',
          firmwareVersion: parsed?.DeviceInfo?.firmwareVersion || 'N/A',
          macAddress: parsed?.DeviceInfo?.macAddress || 'N/A',
          ip: ip,
        }
      };
    } catch (error: any) {
      this.logger.error('Error obteniendo info:', error.message);
      return { success: false, message: 'No se pudo obtener información', error: error.message };
    }
  }

  private extractAttendanceData(payload: any): AttendanceRecord | null {
    const event =
      payload?.AccessControllerEvent ||
      payload?.EventNotificationAlert?.AccessControllerEvent;
    if (!event) return null;

    const minor = Number(event.minor);
    const major = Number(event.major);

    const systemEventMinors = [49, 50, 51, 52, 53, 54, 55];
    if (systemEventMinors.includes(minor)) {
      return null;
    }

    if (major !== 5) {
      return null;
    }

    const employeeId = event.employeeNoString || event.employeeNo;

    if (!employeeId || String(employeeId).trim() === '' || employeeId === '0') {
      return null;
    }

    const timeStr = event.time || payload?.EventNotificationAlert?.dateTime;
    const deviceName = event.deviceName || 'HIKVISION_DS-K1A8503MF';

    if (!timeStr) return null;

    const { dateObj, horaLocal } = this.parseDeviceTimeToLocal(timeStr);

    return {
      employeeId: String(employeeId),
      timestamp: dateObj,
      horaLocal,
      deviceName,
      rawType: String(event.eventType || minor || 'AccessControl'),
    };
  }
}