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

  // ============ Sincronización ============
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

  // ============ Usuarios ============
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

  // ============ Consultas ============
  getFormattedEvents(employeeIdFilter?: string) {
    return this.query.getFormattedEvents(employeeIdFilter);
  }

  getStats() {
    return this.query.getStats();
  }

  getAllRecordsOrderedByDate() {
    return this.query.getAllRecordsOrderedByDate();
  }

  getMarcajesPorFecha(fechaStr: string) {
    return this.query.getMarcajesPorFecha(fechaStr);
  }

  // ============ Storage / utilidades ============
  getSavedEvents() {
    return this.storage.getSavedEvents();
  }

  cleanDuplicates() {
    return this.storage.cleanDuplicates();
  }

  exportDetailedJson() {
    return this.storage.exportDetailedJson();
  }

  checkExcelStatus() {
    return this.storage.checkExcelStatus();
  }

  async refreshEmployeeNames() {
  this.logger.log('🔄 Iniciando refresh de nombres...');
  const result = await this.storage.refreshEmployeeNames((id) =>
    this.deviceProvider.device.getEmployeeName(id),
  );

  // Limpiar cache para asegurar que se lean nombres frescos
  this.deviceProvider.device.clearEmployeeCache();

  return {
    success: true,
    message: `Se actualizaron ${result.actualizados} registros con nombres nuevos`,
    actualizados: result.actualizados,
    total: result.total,
    errores: result.errores,
  };
}

  // ============ Device ============
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