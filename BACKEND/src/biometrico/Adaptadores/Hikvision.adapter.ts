import { Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as util from 'util';
import * as xml2js from 'xml2js';
import {
  IBiometricDevice,
  DeviceConfig,
  DeviceUser,
  UserPayload,
  DeviceResponse,
  FetchEventsOptions,
  FetchEventsResult,
  AttendanceRecord,
} from '../Interfaces/biometrico-device.interface';

const execPromise = util.promisify(exec);

export class HikvisionAdapter implements IBiometricDevice {
  private readonly logger = new Logger(HikvisionAdapter.name);
  readonly deviceType = 'hikvision';
  readonly defaultTimezone = '+08:00';

  private employeeMap = new Map<string, { name: string; timestamp: number }>();
  private readonly EMPLOYEE_CACHE_TTL = 24 * 60 * 60 * 1000;

  constructor(private readonly config: DeviceConfig) {}

  // ============ Helpers ============

  private get ip() { return this.config.ip || ''; }
  private get user() { return this.config.user || 'admin'; }
  private get pass() { return this.config.pass || ''; }
  private get timezone() { return this.config.timezone || this.defaultTimezone; }

  private async curl(path: string, method = 'POST', data?: any): Promise<string> {
    const body = data ? `-d "${JSON.stringify(data).replace(/"/g, '\\"')}"` : '';
    const cmd = `curl --digest -u ${this.user}:${this.pass} -H "Content-Type: application/json" -X ${method} ${body} http://${this.ip}${path}`;
    const { stdout } = await execPromise(cmd, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 50,
    });
    return stdout;
  }

  private async curlXml(path: string): Promise<string> {
    const cmd = `curl --digest -u ${this.user}:${this.pass} http://${this.ip}${path}`;
    const { stdout } = await execPromise(cmd, { timeout: 10000 });
    return stdout;
  }

  private parseXml(xmlString: string): Promise<any> {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xmlString, { explicitArray: false }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  private parseResponse(stdout: string): DeviceResponse {
    try {
      const response = JSON.parse(stdout);
      const ok = response?.statusCode === 1 || response?.statusString === 'OK';
      return {
        success: !!ok,
        code: response?.statusCode,
        message: response?.statusString || response?.subStatusCode,
        raw: response,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private formatDeviceTime(date: Date, isStart: boolean): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const t = isStart ? '00:00:00' : '23:59:59';
    return `${y}-${m}-${d}T${t}${this.timezone}`;
  }

  private parseDeviceTime(timeStr: string): { dateObj: Date; horaLocal: string } {
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

  private addYears(date: Date, years: number): Date {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  // ============ Dispositivo ============

  async getDeviceInfo() {
    try {
      const stdout = await this.curlXml('/ISAPI/System/deviceInfo');
      const parsed = await this.parseXml(stdout);
      return {
        success: true,
        info: {
          deviceName: parsed?.DeviceInfo?.deviceName || 'N/A',
          model: parsed?.DeviceInfo?.model || 'N/A',
          serialNumber: parsed?.DeviceInfo?.serialNumber || 'N/A',
          firmwareVersion: parsed?.DeviceInfo?.firmwareVersion || 'N/A',
          macAddress: parsed?.DeviceInfo?.macAddress || 'N/A',
          ip: this.ip,
        },
      };
    } catch (error: any) {
      this.logger.error('Error obteniendo info:', error.message);
      return { success: false, message: error.message };
    }
  }

  async getDeviceTime(): Promise<Date> {
    try {
      const stdout = await this.curlXml('/ISAPI/System/deviceInfo');
      const parsed = await this.parseXml(stdout);
      const deviceTime = parsed?.DeviceInfo?.deviceTime || parsed?.DeviceInfo?.DateTime;
      return deviceTime ? new Date(deviceTime) : new Date();
    } catch {
      return new Date();
    }
  }

  async testConnection(): Promise<boolean> {
    const info = await this.getDeviceInfo();
    return info.success;
  }

  // ============ Usuarios ============

  async listUsers(includeInactive = false): Promise<DeviceUser[]> {
    const maxResults = 100;
    let searchResultPosition = 0;
    let totalMatches = 0;
    let todosUsuarios: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const stdout = await this.curl('/ISAPI/AccessControl/UserInfo/Search?format=json', 'POST', {
        UserInfoSearchCond: {
          searchID: '1',
          searchResultPosition,
          maxResults,
        },
      });
      const data = JSON.parse(stdout);
      const usuarios = data?.UserInfoSearch?.UserInfo || [];
      totalMatches = data?.UserInfoSearch?.totalMatches || 0;

      todosUsuarios = todosUsuarios.concat(usuarios);
      searchResultPosition += usuarios.length;

      if (todosUsuarios.length >= totalMatches || usuarios.length === 0) {
        hasMore = false;
      }
    }

    if (!includeInactive) {
      todosUsuarios = todosUsuarios.filter(u => u.Valid?.enable !== false);
    }

    return todosUsuarios.map(u => ({
      employeeNo: String(u.employeeNo),
      name: u.name || 'DESCONOCIDO',
      userType: u.userType,
      userGroup: u.userGroup || '',
      activo: u.Valid?.enable !== false,
      raw: u,
    }));
  }

  async getUser(employeeNo: string): Promise<DeviceUser | null> {
    try {
      const stdout = await this.curl('/ISAPI/AccessControl/UserInfo/Search?format=json', 'POST', {
        UserInfoSearchCond: {
          searchID: '1',
          searchResultPosition: 0,
          maxResults: 1,
          EmployeeNoList: [{ employeeNo }],
        },
      });
      const data = JSON.parse(stdout);
      const u = data?.UserInfoSearch?.UserInfo?.[0];
      if (!u) return null;
      return {
        employeeNo: String(u.employeeNo),
        name: u.name || 'DESCONOCIDO',
        userType: u.userType,
        userGroup: u.userGroup || '',
        activo: u.Valid?.enable !== false,
        raw: u,
      };
    } catch {
      return null;
    }
  }

  async getEmployeeName(employeeId: string): Promise<string> {
    if (!employeeId || employeeId === '0') return 'DESCONOCIDO';

    const cached = this.employeeMap.get(employeeId);
    if (cached && Date.now() - cached.timestamp < this.EMPLOYEE_CACHE_TTL) {
      return cached.name;
    }

    try {
      const user = await this.getUser(employeeId);
      const name = user?.name || 'DESCONOCIDO';
      this.employeeMap.set(employeeId, { name, timestamp: Date.now() });
      return name;
    } catch (error: any) {
      this.logger.error(`Error obteniendo nombre para ${employeeId}:`, error.message);
      return 'DESCONOCIDO';
    }
  }

  private buildUserPayload(user: UserPayload) {
    return {
      UserInfo: {
        employeeNo: user.employeeNo,
        name: (user.name || '').slice(0, 32),
        userType: user.userType || 'normal',
        userGroup: user.userGroup || 'EMPLEADO',
        doorRight: user.doorRight || '1',
        Valid: {
          enable: true,
          beginTime: (user.validFrom || new Date()).toISOString().slice(0, 19),
          endTime: (user.validTo || this.addYears(new Date(), 10)).toISOString().slice(0, 19),
        },
      },
    };
  }

  async createUser(user: UserPayload): Promise<DeviceResponse> {
    const stdout = await this.curl(
      '/ISAPI/AccessControl/UserInfo/Record?format=json',
      'POST',
      this.buildUserPayload(user),
    );
    return this.parseResponse(stdout);
  }

  async updateUser(user: UserPayload): Promise<DeviceResponse> {
    const stdout = await this.curl(
      '/ISAPI/AccessControl/UserInfo/Modify?format=json',
      'PUT',
      this.buildUserPayload(user),
    );
    return this.parseResponse(stdout);
  }

  async upsertUser(user: UserPayload): Promise<DeviceResponse> {
    const createResult = await this.createUser(user);
    if (createResult.success) return createResult;

    const raw = createResult.raw;
    if (
      raw?.subStatusCode === 'deviceUserAlreadyExist' ||
      raw?.errorMsg === 'deviceUserAlreadyExist'
    ) {
      return this.updateUser(user);
    }
    return createResult;
  }

  async activateUser(employeeNo: string): Promise<DeviceResponse> {
    const current = await this.getUser(employeeNo);
    if (!current) {
      return {
        success: false,
        message: `El usuario ${employeeNo} no existe en el biométrico`,
      };
    }

    // ✅ FIX: usar strings hardcoded con formato Hikvision válido
    // (igual que deactivateUser, pero con enable: true)
    const payload = {
      UserInfo: {
        employeeNo,
        name: current.name,
        userType: current.userType || 'normal',
        userGroup: current.userGroup || 'EMPLEADO',
        doorRight: '1',
        Valid: {
          enable: true,
          beginTime: '2020-01-01T00:00:00',   // ⬅️ Ya efectivo (en el pasado)
          endTime: '2036-01-01T23:59:59',      // ⬅️ Válido hasta 2036
        },
      },
    };

    const stdout = await this.curl(
      '/ISAPI/AccessControl/UserInfo/Modify?format=json',
      'PUT',
      payload,
    );

    const result = this.parseResponse(stdout);
    if (result.success) {
      this.employeeMap.delete(employeeNo);
    }
    return result;
  }

  async deactivateUser(employeeNo: string): Promise<DeviceResponse> {
    const current = await this.getUser(employeeNo);
    if (!current) {
      return { success: false, message: `El usuario ${employeeNo} no existe` };
    }

    const payload = {
      UserInfo: {
        employeeNo,
        name: current.name,
        userType: current.userType || 'normal',
        Valid: {
          enable: false,
          beginTime: '2026-01-01T00:00:00',
          endTime: '2036-01-01T23:59:59',
        },
      },
    };

    const stdout = await this.curl(
      '/ISAPI/AccessControl/UserInfo/Modify?format=json',
      'PUT',
      payload,
    );
    return this.parseResponse(stdout);
  }

  // ============ Marcajes ============

  async fetchEvents(options: FetchEventsOptions): Promise<FetchEventsResult> {
    const position = options.position ?? 0;
    const maxResults = options.maxResults ?? 100;

    const stdout = await this.curl('/ISAPI/AccessControl/AcsEvent?format=json', 'POST', {
      AcsEventCond: {
        searchID: '1',
        searchResultPosition: position,
        maxResults,
        major: 0,
        minor: 0,
        startTime: this.formatDeviceTime(options.start, true),
        endTime: this.formatDeviceTime(options.end, false),
      },
    });

    const data = JSON.parse(stdout);
    const events = data?.AcsEvent?.InfoList || [];
    const total = data?.AcsEvent?.totalMatches || 0;

    return {
      events,
      totalMatches: total,
      hasMore: position + events.length < total,
    };
  }

  async fetchAllEvents(start: Date, end: Date): Promise<any[]> {
    const allEvents: any[] = [];
    let position = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const page = await this.fetchEvents({ start, end, position, maxResults: pageSize });
      allEvents.push(...page.events);
      position += page.events.length;
      hasMore = page.hasMore;
      if (hasMore) await new Promise(r => setTimeout(r, 300));
    }

    return allEvents;
  }

  isAttendanceEvent(rawEvent: any): boolean {
    const major = Number(rawEvent.major);
    const minor = Number(rawEvent.minor);
    const systemEventMinors = [49, 50, 51, 52, 53, 54, 55];
    if (systemEventMinors.includes(minor)) return false;
    if (major !== 5) return false;
    const empId = rawEvent.employeeNoString || rawEvent.employeeNo || rawEvent.cardNo;
    if (!empId || String(empId).trim() === '' || empId === '0') return false;
    return true;
  }

  parseEvent(rawEvent: any): AttendanceRecord | null {
    if (!this.isAttendanceEvent(rawEvent)) return null;

    const empId = rawEvent.employeeNoString || rawEvent.employeeNo || rawEvent.cardNo;
    const timeStr = rawEvent.time;
    if (!timeStr) return null;

    const { dateObj, horaLocal } = this.parseDeviceTime(timeStr);

    return {
      employeeId: String(empId),
      timestamp: dateObj,
      horaLocal,
      deviceName: rawEvent.deviceName || 'DS-K1A8503MF',
      rawType: String(Number(rawEvent.minor) || rawEvent.eventType || '38'),
    };
  }

  clearEmployeeCache() {
    this.employeeMap.clear();
    this.logger.log('🧹 Caché de empleados limpiada');
  }
}