import { Injectable,Logger } from '@nestjs/common';
import { MarcajesSyncService } from './Async/marcajes-async.service';
import { UsuariosBiometricoService } from './Users/usuarios-biometrico.service';
import { MarcajesQueryService } from './Query/marcajes-query.service';
import { MarcajesStorageService } from './Storage/marcajes-storage.service';
import { BiometricDeviceProvider } from './Providers/biometrico-device.provider';

export type { AttendanceRecord } from './Interfaces/biometrico-device.interface';

@Injectable()
export class BiometricoService {
  private readonly logger = new Logger(BiometricoService.name);

  constructor(
    private readonly sync: MarcajesSyncService,
    private readonly users: UsuariosBiometricoService,
    private readonly query: MarcajesQueryService,
    private readonly storage: MarcajesStorageService,
    private readonly deviceProvider: BiometricDeviceProvider,
  ) {}

  // =========================================================
  // SINCRONIZACIÓN
  // =========================================================
  syncAllLogsFromDevice() {
    return this.sync.syncAllLogsFromDevice();
  }

  syncLogsFromDevice(
    _ip?: string,
    _user?: string,
    _pass?: string,
    options?: { startDate?: string; endDate?: string; daysBack?: number },
  ) {
    return this.sync.syncLogsFromDevice(options);
  }

  insertAttendanceRecord(data: any) {
    return this.sync.insertAttendanceRecord(data);
  }

  processEventPayload(body: any, contentType?: string) {
    return this.sync.processEventPayload(body, contentType);
  }

  // =========================================================
  // USUARIOS
  // =========================================================
  listUsers(
    _ip?: string,
    _user?: string,
    _pass?: string,
    incluirInactivos = false,
  ) {
    return this.users.listUsers(incluirInactivos);
  }

  importUsersFromExcel(
    excelPath: string,
    _ip?: string,
    _user?: string,
    _pass?: string,
  ) {
    return this.users.importUsersFromExcel(excelPath);
  }

  deleteUserFromDevice(
    employeeNo: string,
    _ip?: string,
    _user?: string,
    _pass?: string,
  ) {
    return this.users.deleteUser(employeeNo);
  }

  activateUserInDevice(
    employeeNo: string,
    _ip?: string,
    _user?: string,
    _pass?: string,
  ) {
    return this.users.activateUser(employeeNo);
  }

  prepareUserForFingerprint(
    employeeNo: string,
    _ip?: string,
    _user?: string,
    _pass?: string,
  ) {
    return this.users.prepareForFingerprint(employeeNo);
  }

  listPendingFingerprint() {
    return this.users.listPendingFingerprint();
  }

  removeFromPendingFingerprintList(employeeNo: string) {
    return this.users.removeFromPendingList(employeeNo);
  }

  // =========================================================
  // CONSULTAS (async porque el storage es BD)
  // =========================================================
  async getFormattedEvents(employeeIdFilter?: string) {
    return await this.query.getFormattedEvents(employeeIdFilter);
  }

  async getStats() {
    return await this.query.getStats();
  }

  async getAllRecordsOrderedByDate() {
    return await this.query.getAllRecordsOrderedByDate();
  }

  async getMarcajesPorFecha(fechaStr: string) {
    return await this.query.getMarcajesPorFecha(fechaStr);
  }

  // =========================================================
  // STORAGE / UTILIDADES (async porque el storage es BD)
  // =========================================================
  async getSavedEvents() {
    return await this.storage.getSavedEvents();
  }

  async cleanDuplicates() {
    return await this.storage.cleanDuplicates();
  }

  async exportDetailedJson() {
    return await this.storage.exportDetailedJson();
  }

  async checkExcelStatus() {
    return await this.storage.checkExcelStatus();
  }

  // =========================================================
  // REFRESH DE NOMBRES
  // =========================================================
  async refreshEmployeeNames() {
    this.logger.log('🔄 Iniciando refresh de nombres...');

    const result = await this.storage.refreshEmployeeNames((id) =>
      this.deviceProvider.device.getEmployeeName(id),
    );

    // Limpiar caché para asegurar nombres frescos
    this.deviceProvider.device.clearEmployeeCache();

    return {
      success: true,
      message: `Se actualizaron ${result.actualizados} registros con nombres nuevos`,
      actualizados: result.actualizados,
      total: result.total,
      errores: result.errores,
    };
  }

  // =========================================================
  // DEVICE
  // =========================================================
  getEmployeeName(employeeId: string) {
    return this.deviceProvider.device.getEmployeeName(employeeId);
  }

  obtenerHoraBiometrico() {
    return this.deviceProvider.device.getDeviceTime();
  }

  async getDeviceInfo() {
    const result = await this.deviceProvider.device.getDeviceInfo();
    if (result.success) {
      return { success: true, deviceInfo: result.info };
    }
    return {
      success: false,
      message: result.message || 'No se pudo obtener información',
    };
  }

  clearEmployeeCache() {
    this.deviceProvider.device.clearEmployeeCache();
  }
}