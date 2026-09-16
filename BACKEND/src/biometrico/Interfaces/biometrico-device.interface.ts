export type DeviceType = 'hikvision' | 'zkteco' | 'dahua' | 'manual';

export interface DeviceConfig {
  tipo: DeviceType;
  ip?: string;
  user?: string;
  pass?: string;
  timezone?: string;
  nombre?: string;
}

export interface DeviceUser {
  employeeNo: string;
  name: string;
  userType?: string;
  userGroup?: string;
  activo: boolean;
  raw?: any;
}

export interface UserPayload {
  employeeNo: string;
  name: string;
  userType?: string;
  userGroup?: string;
  validFrom?: Date;
  validTo?: Date;
  doorRight?: string;
}

export interface DeviceResponse {
  success: boolean;
  code?: string | number;
  message?: string;
  raw?: any;
}

export interface FetchEventsOptions {
  start: Date;
  end: Date;
  position?: number;
  maxResults?: number;
}

export interface FetchEventsResult {
  events: any[];
  totalMatches: number;
  hasMore: boolean;
}

/**
 * Registro de marcaje unificado. Da igual la marca del biométrico,
 * todos los adaptadores producen este formato.
 */
export interface AttendanceRecord {
  employeeId: string;
  employeeName?: string;
  timestamp: Date;
  horaLocal?: string;
  deviceName: string;
  rawType: string;
}

/**
 * Contrato que TODOS los adaptadores de biométrico deben cumplir.
 * Si mañana cambias de Hikvision a ZKTeco, el resto del código no cambia.
 */
export interface IBiometricDevice {
  readonly deviceType: string;
  readonly defaultTimezone: string;

  // ============ Dispositivo ============
  getDeviceInfo(): Promise<{ success: boolean; info?: any; message?: string }>;
  getDeviceTime(): Promise<Date>;
  testConnection(): Promise<boolean>;

  // ============ Usuarios ============
  listUsers(includeInactive?: boolean): Promise<DeviceUser[]>;
  getUser(employeeNo: string): Promise<DeviceUser | null>;
  getEmployeeName(employeeId: string): Promise<string>;
  createUser(user: UserPayload): Promise<DeviceResponse>;
  updateUser(user: UserPayload): Promise<DeviceResponse>;
  upsertUser(user: UserPayload): Promise<DeviceResponse>;
  activateUser(employeeNo: string): Promise<DeviceResponse>;
  deactivateUser(employeeNo: string): Promise<DeviceResponse>;

  // ============ Marcajes ============
  fetchEvents(options: FetchEventsOptions): Promise<FetchEventsResult>;
  fetchAllEvents(start: Date, end: Date): Promise<any[]>;
  isAttendanceEvent(rawEvent: any): boolean;
  parseEvent(rawEvent: any): AttendanceRecord | null;

  // ============ Cache ============
  clearEmployeeCache(): void;
}