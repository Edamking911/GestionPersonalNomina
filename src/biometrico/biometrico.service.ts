// ============================================
// LÍNEA 1: Importa Injectable y Logger desde NestJS
// Injectable: Permite que esta clase sea inyectada en otros componentes
// Logger: Clase para mostrar mensajes en consola con formato y colores
// ============================================
import { Injectable, Logger } from '@nestjs/common';

// ============================================
// LÍNEA 2: Importa Cron y CronExpression desde NestJS Schedule
// Cron: Decorador que convierte un método en una tarea programada
// CronExpression: Contiene constantes de tiempo (ej: EVERY_5_SECONDS)
// ============================================
import { Cron, CronExpression } from '@nestjs/schedule';

// ============================================
// LÍNEA 3: Importa exec desde child_process de Node.js
// exec: Permite ejecutar comandos del sistema (como curl para hablar con el biométrico)
// ============================================
import { exec } from 'child_process';

// ============================================
// LÍNEA 4: Importa todo el módulo util de Node.js
// util: Contiene funciones útiles como promisify
// ============================================
import * as util from 'util';

// ============================================
// LÍNEA 5: Importa xml2js
// xml2js: Convierte XML a JSON (el biométrico a veces responde en XML)
// ============================================
import * as xml2js from 'xml2js';

// ============================================
// LÍNEA 6: Importa fs (File System)
// fs: Permite leer y escribir archivos en el disco duro
// Se usa para guardar marcajes.json y marcajes.xlsx
// ============================================
import * as fs from 'fs';

// ============================================
// LÍNEA 7: Importa path
// path: Ayuda a construir rutas de archivos compatibles con cualquier SO
// ============================================
import * as path from 'path';

// ============================================
// LÍNEA 8: Importa Workbook desde exceljs
// exceljs: Biblioteca para crear y manipular archivos Excel
// ============================================
import * as Workbook from 'exceljs';

// ============================================
// LÍNEA 9: Convierte exec en una promesa
// execPromise: Ahora podemos usar await en lugar de callbacks
// Ejemplo: await execPromise('comando') en lugar de exec('comando', callback)
// ============================================
const execPromise = util.promisify(exec);

// ============================================
// LÍNEA 10-11: Interface AttendanceRecord
// Define la estructura de datos para un marcaje
// ============================================
export interface AttendanceRecord {
  employeeId: string;      // Ej: "29789773" (cédula del empleado)
  employeeName?: string;   // Ej: "EMANUEL APONTE" (se llena después)
  timestamp: Date;         // Ej: 2026-08-25T14:08:12.000Z (fecha exacta)
  horaLocal?: string;      // Ej: "25/08/2026, 10:08:12 a. m." (texto legible)
  deviceName: string;      // Ej: "DS-K1A8503MF" (modelo del biométrico)
  rawType: string;         // Ej: "38" (38=huella, 155=facial)
}

// ============================================
// LÍNEA 12: Decorador @Injectable()
// Marca esta clase para que NestJS pueda inyectarla en controladores
// ============================================
@Injectable()
export class BiometricoService {
  
  // ============================================
  // LÍNEA 13: Crea un Logger específico para esta clase
  // Los mensajes aparecerán como: [BiometricoService] mensaje
  // ============================================
  private readonly logger = new Logger(BiometricoService.name);
  
  // ============================================
  // LÍNEA 14: Define la ruta del archivo JSON
  // process.cwd() = carpeta donde se ejecuta el proyecto
  // Resultado: C:\Users\...\sistema\marcajes.json
  // ============================================
  private readonly filePath = path.join(process.cwd(), 'marcajes.json');
  
  // ============================================
  // LÍNEA 15: Define la ruta del archivo Excel
  // Resultado: C:\Users\...\sistema\marcajes.xlsx
  // ============================================
  private readonly excelFilePath = path.join(process.cwd(), 'marcajes.xlsx');
  
  // ============================================
  // LÍNEA 16: Define la zona horaria de Venezuela
  // Se usa como referencia (aunque la hora se toma del biométrico)
  // ============================================
  private readonly timeZone = 'America/Caracas';
  
  // ============================================
  // LÍNEA 17: Crea un Map para guardar nombres en caché
  // Clave: ID del empleado, Valor: Nombre
  // Evita consultar al biométrico 100 veces por el mismo empleado
  // ============================================
  private employeeMap = new Map<string, string>();
  
  // ============================================
  // LÍNEA 18: Contador de errores consecutivos
  // Si hay 5 errores seguidos, sabes que algo anda mal
  // ============================================
  private errorCount = 0;
  
  // ============================================
  // LÍNEA 19: Timestamp del último error registrado
  // Se usa para no mostrar 100 errores en 1 minuto
  // ============================================
  private lastErrorLog = 0;
  
  // ============================================
  // LÍNEA 20: Flag que indica si hay una sincronización en curso
  // true = hay sincronización activa, no empezar otra
  // ============================================
  private isSyncing = false;
  
  // ============================================
  // LÍNEA 21: Fecha de la última sincronización exitosa
  // null = nunca se ha sincronizado
  // ============================================
  private lastSyncTime: Date | null = null;

  // ============================================
  // LÍNEA 22: Decorador @Cron
  // Indica que este método se ejecuta automáticamente
  // EVERY_5_SECONDS = cada 5 segundos
  // ============================================
  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleAutoSync() {
    // ============================================
    // LÍNEA 23: Verifica si ya hay una sincronización en curso
    // Si isSyncing es true, sale del método (evita duplicados)
    // ============================================
    if (this.isSyncing) {
      return;
    }

    // ============================================
    // LÍNEA 24: Bloquea el flag para evitar otra sincronización
    // ============================================
    this.isSyncing = true;
    
    // ============================================
    // LÍNEA 25: Inicia bloque try (para capturar errores)
    // ============================================
    try {
      // ============================================
      // LÍNEA 26: Ejecuta la sincronización completa
      // Espera a que termine (await)
      // Guarda el resultado en la variable result
      // ============================================
      const result = await this.syncAllLogsFromDevice();
      
      // ============================================
      // LÍNEA 27: Muestra un log con el resumen
      // Ej: "⏰ Cron: 38 eventos válidos, 1 nuevos guardados"
      // ============================================
      this.logger.log(`⏰ Cron: ${result.totalEventosValidos} eventos válidos, ${result.totalRegistrosNuevosGuardados} nuevos guardados`);
      
      // ============================================
      // LÍNEA 28: Resetea el contador de errores
      // Si llegamos aquí, todo salió bien
      // ============================================
      this.errorCount = 0;
      
    // ============================================
    // LÍNEA 29: Captura cualquier error que ocurra
    // ============================================
    } catch (error: any) {
      // ============================================
      // LÍNEA 30: Obtiene el tiempo actual en milisegundos
      // ============================================
      const now = Date.now();
      
      // ============================================
      // LÍNEA 31: Solo muestra error si pasó 1 minuto del último
      // Evita spam de errores cada 5 segundos
      // ============================================
      if (now - this.lastErrorLog > 60000) {
        // LÍNEA 32: Incrementa contador de errores
        this.errorCount++;
        // LÍNEA 33: Muestra advertencia con el número de intento
        this.logger.warn(`⚠️ Error (Intento #${this.errorCount}): ${error.message}`);
        // LÍNEA 34: Actualiza el timestamp del último error
        this.lastErrorLog = now;
      }
    } finally {
      // ============================================
      // LÍNEA 35: Siempre desbloquea el flag
      // Se ejecuta tanto si hay éxito como si hay error
      // ============================================
      this.isSyncing = false;
    }
  }

  // ============================================
  // LÍNEA 36: Método principal de sincronización
  // Parámetros con valores por defecto (IP, usuario, contraseña)
  // ============================================
  async syncAllLogsFromDevice(
    ip: string = '172.18.0.89',
    user: string = 'admin',
    pass: string = 'Dtd2026*',
  ) {
    try {
      // ============================================
      // LÍNEA 37: Crea fecha de fin (HOY)
      // ============================================
      const endDate = new Date();
      // ============================================
      // LÍNEA 38: Agrega 1 día (MAÑANA)
      // Necesario porque el biométrico está en zona +08:00
      // ============================================
      endDate.setDate(endDate.getDate() + 1);
      
      // ============================================
      // LÍNEA 39: Crea fecha de inicio (HOY)
      // ============================================
      const startDate = new Date();
      // ============================================
      // LÍNEA 40: Resta 30 días (busca últimos 30 días)
      // ============================================
      startDate.setDate(startDate.getDate() - 30);

      // ============================================
      // LÍNEA 41: Función auxiliar para formatear fechas
      // Convierte una Date al formato que el biométrico entiende
      // ============================================
      const formatDate = (date: Date, isStart: boolean) => {
        // LÍNEA 42: Obtiene el año (ej: 2026)
        const year = date.getFullYear();
        // LÍNEA 43: Obtiene el mes con 2 dígitos (ej: "08")
        const month = String(date.getMonth() + 1).padStart(2, '0');
        // LÍNEA 44: Obtiene el día con 2 dígitos (ej: "25")
        const day = String(date.getDate()).padStart(2, '0');
        // LÍNEA 45: Define la hora (00:00:00 para inicio, 23:59:59 para fin)
        const time = isStart ? '00:00:00' : '23:59:59';
        // LÍNEA 46: Retorna el formato completo (ej: "2026-08-25T00:00:00+08:00")
        return `${year}-${month}-${day}T${time}+08:00`;
      };

      // ============================================
      // LÍNEA 47: Formatea la fecha de inicio
      // ============================================
      const startTime = formatDate(startDate, true);
      // ============================================
      // LÍNEA 48: Formatea la fecha de fin
      // ============================================
      const endTime = formatDate(endDate, false);

      // ============================================
      // LÍNEA 49: Muestra log del rango de búsqueda
      // ============================================
      this.logger.log(`📅 Buscando desde ${startTime} hasta ${endTime}`);

      // ============================================
      // LÍNEA 50: Array para almacenar todos los eventos
      // ============================================
      let allEvents: any[] = [];
      // ============================================
      // LÍNEA 51: Posición para la paginación (empieza en 0)
      // ============================================
      let searchResultPosition = 0;
      // ============================================
      // LÍNEA 52: Máximo de eventos por página (100)
      // ============================================
      const maxResultsPerPage = 100;
      // ============================================
      // LÍNEA 53: Total de eventos en el biométrico
      // ============================================
      let totalMatches = 0;
      // ============================================
      // LÍNEA 54: Flag que indica si hay más datos por recuperar
      // ============================================
      let hasMoreData = true;

      // ============================================
      // LÍNEA 55: Bucle de paginación
      // Se repite mientras haya más eventos por recuperar
      // ============================================
      while (hasMoreData) {
        // ============================================
        // LÍNEA 56: Construye el objeto JSON que se enviará al biométrico
        // ============================================
        const payloadObj = {
          AcsEventCond: {
            searchID: '1',                          // ID de búsqueda fijo
            searchResultPosition: searchResultPosition,  // Posición actual
            maxResults: maxResultsPerPage,          // 100 eventos por página
            major: 0,                               // 0 = todos los tipos
            minor: 0,                               // 0 = todos los subtipos
            startTime: startTime,                   // Fecha inicio
            endTime: endTime,                       // Fecha fin
          },
        };

        // ============================================
        // LÍNEA 57: Convierte el objeto a string JSON
        // Reemplaza " por \" para que curl lo entienda
        // ============================================
        const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
        
        // ============================================
        // LÍNEA 58: Construye el comando curl completo
        // --digest: autenticación digest
        // -u: usuario y contraseña
        // -H: header Content-Type JSON
        // -X POST: método POST
        // -d: datos a enviar
        // URL: endpoint del biométrico
        // ============================================
        const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X POST -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/AcsEvent?format=json`;

        // ============================================
        // LÍNEA 59: Ejecuta el comando curl
        // timeout: 30 segundos máximo
        // maxBuffer: 50MB máximo de respuesta
        // ============================================
        const { stdout } = await execPromise(command, { 
          timeout: 30000,
          maxBuffer: 1024 * 1024 * 50
        });

        // ============================================
        // LÍNEA 60: Si no hay respuesta, lanza error
        // ============================================
        if (!stdout) {
          throw new Error('Sin respuesta del biométrico');
        }

        // ============================================
        // LÍNEA 61: Convierte la respuesta JSON a objeto
        // ============================================
        const data = JSON.parse(stdout);
        // ============================================
        // LÍNEA 62: Obtiene los eventos de esta página
        // Si no hay InfoList, usa array vacío
        // ============================================
        const events = data?.AcsEvent?.InfoList || [];
        // ============================================
        // LÍNEA 63: Obtiene el total de eventos disponibles
        // ============================================
        totalMatches = data?.AcsEvent?.totalMatches || 0;

        // ============================================
        // LÍNEA 64: Si hay eventos en esta página
        // ============================================
        if (events.length > 0) {
          // ============================================
          // LÍNEA 65: Agrega los eventos al array principal
          // ============================================
          allEvents = allEvents.concat(events);
          // ============================================
          // LÍNEA 66: Avanza la posición para la siguiente página
          // ============================================
          searchResultPosition += events.length;
          
          // ============================================
          // LÍNEA 67: Si ya recuperamos todos los eventos
          // ============================================
          if (allEvents.length >= totalMatches) {
            // LÍNEA 68: Detiene el bucle
            hasMoreData = false;
          }
        } else {
          // ============================================
          // LÍNEA 69: No hay más eventos, detener
          // ============================================
          hasMoreData = false;
        }

        // ============================================
        // LÍNEA 70: Si aún hay más datos
        // ============================================
        if (hasMoreData) {
          // LÍNEA 71: Espera 300ms antes de la siguiente página
          // Evita sobrecargar el biométrico
          // ============================================
          await this.delay(300);
        }
      }

      // ============================================
      // LÍNEA 72: Log con total de eventos recuperados
      // ============================================
      this.logger.log(`📊 Total eventos: ${allEvents.length}`);

      // ============================================
      // LÍNEA 73: Array para registros válidos
      // ============================================
      const validRecords: AttendanceRecord[] = [];
      // ============================================
      // LÍNEA 74: Contador de eventos del sistema ignorados
      // ============================================
      let ignoredSystemEvents = 0;
      // ============================================
      // LÍNEA 75: Contador de eventos sin empleado
      // ============================================
      let ignoredEmptyEmployee = 0;
      // ============================================
      // LÍNEA 76: Contador de eventos con major inválido
      // ============================================
      let ignoredInvalidMajor = 0;

      // ============================================
      // LÍNEA 77: Bucle para procesar cada evento
      // ============================================
      for (const ev of allEvents) {
        // ============================================
        // LÍNEA 78: Convierte minor a número
        // minor = subtipo de evento (38=huella, 49=sistema)
        // ============================================
        const minor = Number(ev.minor);
        // ============================================
        // LÍNEA 79: Convierte major a número
        // major = tipo principal (5=acceso válido)
        // ============================================
        const major = Number(ev.major);

        // ============================================
        // LÍNEA 80: Lista de minors que son eventos del sistema
        // 49-55 = alarmas, tamper, etc.
        // ============================================
        const systemEventMinors = [49, 50, 51, 52, 53, 54, 55];
        // ============================================
        // LÍNEA 81: Si es evento del sistema, ignorar
        // ============================================
        if (systemEventMinors.includes(minor)) {
          // LÍNEA 82: Incrementa contador
          ignoredSystemEvents++;
          // LÍNEA 83: Salta al siguiente evento
          continue;
        }

        // ============================================
        // LÍNEA 84: Si major no es 5, ignorar
        // ============================================
        if (major !== 5) {
          // LÍNEA 85: Incrementa contador
          ignoredInvalidMajor++;
          // LÍNEA 86: Salta al siguiente evento
          continue;
        }

        // ============================================
        // LÍNEA 87: Obtiene el ID del empleado
        // Prueba 3 campos diferentes
        // ============================================
        const empId = ev.employeeNoString || ev.employeeNo || ev.cardNo;
        // ============================================
        // LÍNEA 88: Si no hay empleado, ignorar
        // ============================================
        if (!empId || String(empId).trim() === '' || empId === '0') {
          // LÍNEA 89: Incrementa contador
          ignoredEmptyEmployee++;
          // LÍNEA 90: Salta al siguiente evento
          continue;
        }

        // ============================================
        // LÍNEA 91: Convierte ID a string
        // ============================================
        const idStr = String(empId);
        // ============================================
        // LÍNEA 92: Obtiene el nombre del empleado (con caché)
        // ============================================
        const name = await this.getEmployeeName(idStr, ip, user, pass);
        // ============================================
        // LÍNEA 93: Parsea la fecha y hora a formato Venezuela
        // ============================================
        const { dateObj, horaLocal } = this.parseDeviceTimeToLocal(ev.time);
        
        // ============================================
        // LÍNEA 94: Crea el registro de asistencia
        // ============================================
        const record: AttendanceRecord = {
          employeeId: idStr,                              // ID del empleado
          employeeName: name,                              // Nombre resuelto
          timestamp: dateObj,                              // Fecha exacta
          horaLocal,                                       // Hora legible
          deviceName: ev.deviceName || 'DS-K1A8503MF',     // Modelo del biométrico
          rawType: String(minor || ev.eventType || '38'),  // Tipo de marcaje
        };

        // ============================================
        // LÍNEA 95: Agrega el registro al array de válidos
        // ============================================
        validRecords.push(record);
      }

      // ============================================
      // LÍNEA 96: Log con resumen del filtrado
      // ============================================
      this.logger.log(`✅ Eventos válidos: ${validRecords.length} | Sistema: ${ignoredSystemEvents} | Sin empleado: ${ignoredEmptyEmployee} | Major inválido: ${ignoredInvalidMajor}`);

      // ============================================
      // LÍNEA 97: Variable para contar registros nuevos
      // ============================================
      let newRecordsAdded = 0;
      // ============================================
      // LÍNEA 98: Si hay registros válidos
      // ============================================
      if (validRecords.length > 0) {
        // ============================================
        // LÍNEA 99: Guarda los registros (JSON + Excel)
        // Retorna cuántos registros nuevos se guardaron
        // ============================================
        newRecordsAdded = await this.saveMultipleRecords(validRecords);
        // ============================================
        // LÍNEA 100: Actualiza la fecha de última sincronización
        // ============================================
        this.lastSyncTime = new Date();
      }

      // ============================================
      // LÍNEA 101: Log con registros guardados
      // ============================================
      this.logger.log(`💾 Registros nuevos guardados: ${newRecordsAdded}`);

      // ============================================
      // LÍNEA 102-110: Retorna objeto con resumen completo
      // ============================================
      return {
        success: true,                                    // Indica éxito
        message: 'Sincronización completa',               // Mensaje
        totalEventosEnBiometrico: allEvents.length,       // Total eventos
        totalEventosValidos: validRecords.length,         // Eventos válidos
        totalRegistrosNuevosGuardados: newRecordsAdded,   // Nuevos guardados
        totalEventosSistemaIgnorados: ignoredSystemEvents, // Del sistema
        totalSinEmpleadoIgnorados: ignoredEmptyEmployee,  // Sin empleado
        totalMajorInvalidoIgnorados: ignoredInvalidMajor, // Major inválido
        empleadosUnicos: [...new Set(validRecords.map(v => v.employeeId))].length, // Empleados únicos
      };
      
    // ============================================
    // LÍNEA 111: Captura errores
    // ============================================
    } catch (error: any) {
      // LÍNEA 112: Log del error
      this.logger.error('Error al sincronizar:', error?.message || error);
      // LÍNEA 113: Relanza el error para que el cron lo maneje
      throw error;
    }
  }

  // ============================================
  // LÍNEA 114: Método para sincronizar por rango de fechas
  // Similar al anterior pero con fechas personalizadas
  // ============================================
  async syncLogsFromDevice(
    ip: string = '172.18.0.89',
    user: string = 'admin',
    pass: string = 'Dtd2026*',
    options?: {  // Parámetros opcionales
      startDate?: string;  // Fecha inicio (YYYY-MM-DD)
      endDate?: string;    // Fecha fin (YYYY-MM-DD)
      daysBack?: number;   // O días hacia atrás
    }
  ) {
    try {
      // ============================================
      // LÍNEA 115-116: Variables para las fechas
      // ============================================
      let startDate: Date;
      let endDate: Date;
      
      // ============================================
      // LÍNEA 117: Si se proporcionaron fechas específicas
      // ============================================
      if (options?.startDate && options?.endDate) {
        startDate = new Date(options.startDate);
        endDate = new Date(options.endDate);
      // ============================================
      // LÍNEA 118: Si se proporcionó días hacia atrás
      // ============================================
      } else if (options?.daysBack) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);
        startDate = new Date();
        startDate.setDate(startDate.getDate() - options.daysBack);
      // ============================================
      // LÍNEA 119: Por defecto: hoy hasta mañana
      // ============================================
      } else {
        startDate = new Date();
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);
      }
      
      // ============================================
      // LÍNEA 120-127: Formatea las fechas (igual que antes)
      // ============================================
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
      
      // ============================================
      // LÍNEA 128-137: Construye payload (máx 500 eventos)
      // ============================================
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
      
      // ============================================
      // LÍNEA 138-140: Ejecuta y valida respuesta
      // ============================================
      const { stdout } = await execPromise(command, { 
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 50
      });
      
      if (!stdout) {
        throw new Error('Sin respuesta del biométrico');
      }
      
      // ============================================
      // LÍNEA 141-143: Parsea respuesta
      // ============================================
      const data = JSON.parse(stdout);
      const events = data?.AcsEvent?.InfoList || [];
      
      this.logger.log(`📋 Eventos recibidos: ${events.length}`);
      
      // ============================================
      // LÍNEA 144-147: Variables de filtrado
      // ============================================
      const validRecords: AttendanceRecord[] = [];
      let ignoredSystemEvents = 0;
      let ignoredEmptyEmployee = 0;
      let ignoredInvalidMajor = 0;
      
      // ============================================
      // LÍNEA 148-188: Mismo bucle de filtrado que syncAll
      // ============================================
      for (const ev of events) {
        const minor = Number(ev.minor);
        const major = Number(ev.major);
        
        const systemEventMinors = [49, 50, 51, 52, 53, 54, 55];
        if (systemEventMinors.includes(minor)) {
          ignoredSystemEvents++;
          continue;
        }
        
        if (major !== 5) {
          ignoredInvalidMajor++;
          continue;
        }
        
        const empId = ev.employeeNoString || ev.employeeNo || ev.cardNo;
        
        if (!empId || String(empId).trim() === '' || empId === '0') {
          ignoredEmptyEmployee++;
          continue;
        }
        
        const idStr = String(empId);
        const name = await this.getEmployeeName(idStr, ip, user, pass);
        const { dateObj, horaLocal } = this.parseDeviceTimeToLocal(ev.time);
        
        const record: AttendanceRecord = {
          employeeId: idStr,
          employeeName: name,
          timestamp: dateObj,
          horaLocal,
          deviceName: ev.deviceName || 'DS-K1A8503MF',
          rawType: String(minor || ev.eventType || '38'),
        };
        
        validRecords.push(record);
      }
      
      // ============================================
      // LÍNEA 189-192: Guarda registros
      // ============================================
      let newRecordsAdded = 0;
      if (validRecords.length > 0) {
        newRecordsAdded = await this.saveMultipleRecords(validRecords);
      }
      
      // ============================================
      // LÍNEA 193-205: Retorna resumen
      // ============================================
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

  // ============================================
  // LÍNEA 206: Método para normalizar fechas
  // Recibe: Date, string, o cualquier cosa
  // Retorna: Siempre un objeto Date
  // ============================================
  private normalizeDate(date: any): Date {
    // ============================================
    // LÍNEA 207: Si ya es Date, retornarlo tal cual
    // ============================================
    if (date instanceof Date) {
      return date;
    }
    // ============================================
    // LÍNEA 208: Si es string, convertirlo a Date
    // ============================================
    return new Date(date);
  }

  // ============================================
  // LÍNEA 209: Método para verificar estado del Excel
  // ============================================
  async checkExcelStatus() {
    // ============================================
    // LÍNEA 210: Verifica si el archivo existe
    // ============================================
    if (!fs.existsSync(this.excelFilePath)) {
      return {
        success: false,
        message: 'El archivo Excel no existe todavía',
        path: this.excelFilePath,
      };
    }

    try {
      // ============================================
      // LÍNEA 211: Obtiene estadísticas del archivo (tamaño, fecha)
      // ============================================
      const stats = fs.statSync(this.excelFilePath);
      
      // ============================================
      // LÍNEA 212: Crea un nuevo Workbook
      // ============================================
      const workbook: any = new Workbook.Workbook();
      // ============================================
      // LÍNEA 213: Lee el archivo Excel
      // ============================================
      await workbook.xlsx.readFile(this.excelFilePath);
      // ============================================
      // LÍNEA 214: Obtiene la hoja "Marcajes"
      // ============================================
      const worksheet: any = workbook.getWorksheet('Marcajes');
      
      // ============================================
      // LÍNEA 215: Si no existe la hoja
      // ============================================
      if (!worksheet) {
        return {
          success: false,
          message: 'La hoja "Marcajes" no existe',
          totalFilas: 0,
          columnas: 0,
          ultimosRegistros: [],
        };
      }
      
      // ============================================
      // LÍNEA 216: Array para las últimas 5 filas
      // ============================================
      const lastRows: any[] = [];
      // ============================================
      // LÍNEA 217: Total de filas en la hoja
      // ============================================
      const totalRows = worksheet.rowCount;
      // ============================================
      // LÍNEA 218: Fila inicial (últimas 5 filas)
      // Math.max(2, ...) = nunca menor a 2 (salta el header)
      // ============================================
      const startRow = Math.max(2, totalRows - 4);
      
      // ============================================
      // LÍNEA 219: Bucle desde startRow hasta totalRows
      // ============================================
      for (let i = startRow; i <= totalRows; i++) {
        // ============================================
        // LÍNEA 220: Obtiene la fila actual
        // ============================================
        const row = worksheet.getRow(i);
        
        // ============================================
        // LÍNEA 221-226: Agrega datos de la fila al array
        // getCell(1) = Columna A (ID)
        // getCell(2) = Columna B (Nombre)
        // getCell(3) = Columna C (Hora)
        // getCell(4) = Columna D (Método)
        // getCell(5) = Columna E (Dispositivo)
        // ============================================
        lastRows.push({
          fila: i,
          empleadoId: row.getCell(1).value?.toString() || '',
          nombre: row.getCell(2).value?.toString() || '',
          horaLocal: row.getCell(3).value?.toString() || '',
          metodoMarcaje: row.getCell(4).value?.toString() || '',
          dispositivo: row.getCell(5).value?.toString() || '',
        });
      }
      
      // ============================================
      // LÍNEA 227-235: Retorna información completa
      // ============================================
      return {
        success: true,
        message: 'Excel verificado correctamente',
        path: this.excelFilePath,
        tamanoKB: (stats.size / 1024).toFixed(2),     // Tamaño en KB
        ultimaModificacion: stats.mtime,               // Fecha modificación
        totalFilas: worksheet.rowCount - 1,            // -1 por el header
        columnas: worksheet.columnCount,               // Número de columnas
        ultimosRegistros: lastRows,                    // Últimas 5 filas
      };
    } catch (error: any) {
      this.logger.error('Error verificando Excel:', error);
      return {
        success: false,
        message: 'Error al verificar el Excel',
        error: error?.message || String(error),
      };
    }
  }

  // ============================================
  // LÍNEA 236: Método para obtener info del biométrico
  // ============================================
  async getDeviceInfo(
    ip: string = '172.18.0.89',
    user: string = 'admin',
    pass: string = 'Dtd2026*',
  ) {
    try {
      // ============================================
      // LÍNEA 237: Comando curl para obtener información
      // ============================================
      const command = `curl --digest -u ${user}:${pass} http://${ip}/ISAPI/System/deviceInfo`;
      // ============================================
      // LÍNEA 238: Ejecuta el comando
      // ============================================
      const { stdout } = await execPromise(command, { timeout: 10000 });
      
      // ============================================
      // LÍNEA 239: Parsea la respuesta XML
      // ============================================
      const parsed = await this.parseXml(stdout);
      
      // ============================================
      // LÍNEA 240-249: Retorna información del dispositivo
      // ============================================
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
      return {
        success: false,
        message: 'No se pudo obtener información',
        error: error.message,
      };
    }
  }

  // ============================================
  // LÍNEA 250: Método para limpiar duplicados
  // ============================================
  async cleanDuplicates(): Promise<{ removed: number; message: string }> {
    // ============================================
    // LÍNEA 251: Obtiene todos los registros del JSON
    // ============================================
    const events = this.getSavedEvents();
    // ============================================
    // LÍNEA 252: Map para guardar solo registros únicos
    // ============================================
    const uniqueEvents = new Map<string, AttendanceRecord>();
    // ============================================
    // LÍNEA 253: Contador de duplicados eliminados
    // ============================================
    let removed = 0;
    
    // ============================================
    // LÍNEA 254: Bucle para filtrar duplicados
    // ============================================
    for (const event of events) {
      // ============================================
      // LÍNEA 255: Normaliza la fecha
      // ============================================
      const timestamp = this.normalizeDate(event.timestamp);
      // ============================================
      // LÍNEA 256: Crea clave única (empleado + fecha)
      // ============================================
      const key = `${event.employeeId}_${timestamp.toISOString()}`;
      
      // ============================================
      // LÍNEA 257: Si no existe, agregarlo
      // ============================================
      if (!uniqueEvents.has(key)) {
        uniqueEvents.set(key, event);
      } else {
        // ============================================
        // LÍNEA 258: Si existe, es duplicado
        // ============================================
        removed++;
      }
    }
    
    // ============================================
    // LÍNEA 259: Convierte Map a Array
    // ============================================
    const cleanEvents = Array.from(uniqueEvents.values());
    
    // ============================================
    // LÍNEA 260-264: Ordena por fecha
    // ============================================
    cleanEvents.sort((a, b) => {
      const dateA = this.normalizeDate(a.timestamp);
      const dateB = this.normalizeDate(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });
    
    // ============================================
    // LÍNEA 265: Guarda JSON limpio
    // ============================================
    fs.writeFileSync(this.filePath, JSON.stringify(cleanEvents, null, 2), 'utf-8');
    
    // ============================================
    // LÍNEA 266: Regenera Excel con datos limpios
    // ============================================
    await this.regenerateExcel(cleanEvents);
    
    // ============================================
    // LÍNEA 267-270: Retorna resultado
    // ============================================
    return {
      removed,
      message: `Se eliminaron ${removed} duplicados. Total: ${cleanEvents.length}`
    };
  }

  // ============================================
  // LÍNEA 271: Método para regenerar Excel completo
  // ============================================
  private async regenerateExcel(records: AttendanceRecord[]): Promise<void> {
    // ============================================
    // LÍNEA 272: Crea nuevo Workbook
    // ============================================
    const workbook: any = new Workbook.Workbook();
    // ============================================
    // LÍNEA 273: Crea hoja "Marcajes"
    // ============================================
    const worksheet: any = workbook.addWorksheet('Marcajes');
    
    // ============================================
    // LÍNEA 274: Configura columnas
    // ============================================
    this.setupWorksheetColumns(worksheet);
    
    // ============================================
    // LÍNEA 275-279: Ordena registros por fecha
    // ============================================
    const sortedRecords = records.sort((a, b) => {
      const dateA = this.normalizeDate(a.timestamp);
      const dateB = this.normalizeDate(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });
    
    // ============================================
    // LÍNEA 280: Bucle para agregar cada registro
    // ============================================
    for (const record of sortedRecords) {
      // ============================================
      // LÍNEA 281-286: Agrega fila al Excel
      // ============================================
      worksheet.addRow({
        employeeId: record.employeeId,
        employeeName: record.employeeName || 'DESCONOCIDO',
        horaLocal: record.horaLocal,
        metodoMarcaje: this.parseEventType(record.rawType),
        deviceName: record.deviceName,
      });
    }
    
    // ============================================
    // LÍNEA 287: Guarda el archivo Excel
    // ============================================
    await workbook.xlsx.writeFile(this.excelFilePath);
    // ============================================
    // LÍNEA 288: Log de confirmación
    // ============================================
    this.logger.log(`📊 Excel regenerado con ${sortedRecords.length} registros`);
  }

  // ============================================
  // LÍNEA 289: Método para configurar columnas del Excel
  // ============================================
  private setupWorksheetColumns(worksheet: any): void {
    // ============================================
    // LÍNEA 290-296: Define las 5 columnas
    // Cada columna tiene: header (título), key (referencia), width (ancho)
    // ============================================
    worksheet.columns = [
      { header: 'ID / Cédula', key: 'employeeId', width: 15 },
      { header: 'Nombre del Empleado', key: 'employeeName', width: 30 },
      { header: 'Fecha y Hora Local', key: 'horaLocal', width: 25 },
      { header: 'Método de Marcaje', key: 'metodoMarcaje', width: 22 },
      { header: 'Dispositivo', key: 'deviceName', width: 20 },
    ];

    // ============================================
    // LÍNEA 297: Obtiene la fila 1 (header)
    // ============================================
    const headerRow = worksheet.getRow(1);
    // ============================================
    // LÍNEA 298: Pone texto en negrita y blanco
    // ============================================
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    // ============================================
    // LÍNEA 299-303: Pone fondo azul oscuro
    // ============================================
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '004080' },
    };
    // ============================================
    // LÍNEA 304: Centra el texto vertical y horizontalmente
    // ============================================
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  // ============================================
  // LÍNEA 305: Método para obtener estadísticas
  // ============================================
  getStats() {
    // ============================================
    // LÍNEA 306: Obtiene todos los registros
    // ============================================
    const events = this.getSavedEvents();
    
    // ============================================
    // LÍNEA 307: Objeto para agrupar por día
    // ============================================
    const byDay: any = {};
    // ============================================
    // LÍNEA 308: Bucle para agrupar por día
    // ============================================
    events.forEach(e => {
      // LÍNEA 309: Normaliza fecha
      const timestamp = this.normalizeDate(e.timestamp);
      // LÍNEA 310: Obtiene fecha en formato local
      const day = timestamp.toLocaleDateString('es-VE');
      // LÍNEA 311: Si no existe el día, crearlo
      if (!byDay[day]) byDay[day] = [];
      // LÍNEA 312: Agrega evento al día
      byDay[day].push(e);
    });
    
    // ============================================
    // LÍNEA 313: Objeto para agrupar por empleado
    // ============================================
    const byEmployee: any = {};
    // ============================================
    // LÍNEA 314: Bucle para agrupar por empleado
    // ============================================
    events.forEach(e => {
      // LÍNEA 315: Si no existe el empleado, crearlo
      if (!byEmployee[e.employeeId]) {
        byEmployee[e.employeeId] = {
          nombre: e.employeeName || 'DESCONOCIDO',
          totalMarcajes: 0,
          ultimoMarcaje: null,
        };
      }
      // LÍNEA 316: Incrementa contador
      byEmployee[e.employeeId].totalMarcajes++;
      // LÍNEA 317: Actualiza último marcaje
      byEmployee[e.employeeId].ultimoMarcaje = e.horaLocal;
    });
    
    // ============================================
    // LÍNEA 318-329: Retorna estadísticas completas
    // ============================================
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

  // ============================================
  // LÍNEA 330: Método para pausar la ejecución
  // ============================================
  private delay(ms: number): Promise<void> {
    // ============================================
    // LÍNEA 331: Retorna una promesa que se resuelve después de ms
    // ============================================
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // LÍNEA 332: Método para convertir código a texto legible
  // ============================================
  parseEventType(rawType: string): string {
    // ============================================
    // LÍNEA 333-340: Mapa de códigos a texto
    // ============================================
    const typeMap: Record<string, string> = {
      '1': 'Tarjeta RFID',
      '2': 'Contraseña/PIN',
      '38': 'Huella Dactilar',
      '75': 'Apertura por Software',
      '155': 'Huella Dactilar',
      '160': 'Huella Dactilar',
    };

    // ============================================
    // LÍNEA 341: Retorna el texto o "Huella Dactilar" por defecto
    // ============================================
    return typeMap[rawType] || 'Huella Dactilar';
  }

  // ============================================
  // LÍNEA 342: Método para convertir fecha del biométrico a hora local
  // ============================================
  private parseDeviceTimeToLocal(timeStr: string): { dateObj: Date; horaLocal: string } {
    // ============================================
    // LÍNEA 343: Variable para la fecha
    // ============================================
    let dateObj: Date;
    
    try {
      // ============================================
      // LÍNEA 344: Quita la zona horaria (+08:00)
      // Ej: "2026-08-25T10:08:12+08:00" → "2026-08-25T10:08:12"
      // ============================================
      const timeWithoutZone = timeStr.replace(/[+-]\d{2}:\d{2}$/, '');
      
      // ============================================
      // LÍNEA 345: Parsea la fecha sin zona horaria
      // ============================================
      dateObj = new Date(timeWithoutZone);
      
      // ============================================
      // LÍNEA 346: Si falla, intentar parse manual
      // ============================================
      if (isNaN(dateObj.getTime())) {
        // ============================================
        // LÍNEA 347: Extrae componentes con regex
        // ============================================
        const match = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        // ============================================
        // LÍNEA 348: Si hay match
        // ============================================
        if (match) {
          // ============================================
          // LÍNEA 349: Desestructura y convierte a números
          // ============================================
          const [, year, month, day, hours, minutes, seconds] = match.map(Number);
          // ============================================
          // LÍNEA 350: Crea fecha manualmente
          // month - 1 porque JS usa meses 0-11
          // ============================================
          dateObj = new Date(year, month - 1, day, hours, minutes, seconds);
        }
      }
      
      // ============================================
      // LÍNEA 351-359: Formatea en español venezolano
      // hour12: true = formato 12 horas (a.m./p.m.)
      // ============================================
      const horaLocal = new Intl.DateTimeFormat('es-VE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(dateObj);
      
      // ============================================
      // LÍNEA 360: Retorna fecha y hora formateada
      // ============================================
      return { dateObj, horaLocal };
      
    } catch (error) {
      // ============================================
      // LÍNEA 361: Si hay error, usar fecha actual
      // ============================================
      const fallbackDate = new Date();
      // ============================================
      // LÍNEA 362-365: Retorna fecha actual como respaldo
      // ============================================
      return {
        dateObj: fallbackDate,
        horaLocal: fallbackDate.toLocaleString('es-VE', { hour12: true }),
      };
    }
  }

  // ============================================
  // LÍNEA 366: Método para obtener nombre del empleado
  // ============================================
  async getEmployeeName(
    employeeId: string,
    ip: string = '172.18.0.89',
    user: string = 'admin',
    pass: string = 'Dtd2026*',
  ): Promise<string> {
    // ============================================
    // LÍNEA 367: Valida que el ID no esté vacío
    // ============================================
    if (!employeeId || String(employeeId).trim() === '' || employeeId === '0') {
      return 'DESCONOCIDO';
    }

    // ============================================
    // LÍNEA 368: Verifica si ya está en caché
    // ============================================
    if (this.employeeMap.has(employeeId)) {
      // ============================================
      // LÍNEA 369: Retorna nombre desde caché
      // ============================================
      return this.employeeMap.get(employeeId)!;
    }

    try {
      // ============================================
      // LÍNEA 370-378: Construye payload para buscar usuario
      // ============================================
      const payloadObj = {
        UserInfoSearchCond: {
          searchID: '1',
          searchResultPosition: 0,
          maxResults: 1,
          EmployeeNoList: [{ employeeNo: employeeId }],
        },
      };

      // ============================================
      // LÍNEA 379: Convierte payload a string
      // ============================================
      const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
      // ============================================
      // LÍNEA 380: Construye comando curl
      // ============================================
      const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X POST -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Search?format=json`;

      // ============================================
      // LÍNEA 381: Ejecuta comando
      // ============================================
      const { stdout } = await execPromise(command, { timeout: 10000 });

      // ============================================
      // LÍNEA 382: Si hay respuesta
      // ============================================
      if (stdout) {
        // ============================================
        // LÍNEA 383: Parsea JSON
        // ============================================
        const data = JSON.parse(stdout);
        // ============================================
        // LÍNEA 384: Obtiene primer usuario
        // ============================================
        const userInfo = data?.UserInfoSearch?.UserInfo?.[0];
        // ============================================
        // LÍNEA 385: Obtiene nombre o "DESCONOCIDO"
        // ============================================
        const name = userInfo?.name || 'DESCONOCIDO';
        // ============================================
        // LÍNEA 386: Guarda en caché
        // ============================================
        this.employeeMap.set(employeeId, name);
        // ============================================
        // LÍNEA 387: Retorna nombre
        // ============================================
        return name;
      }
    } catch (error: any) {
      // ============================================
      // LÍNEA 388: Log del error
      // ============================================
      this.logger.error(`Error obteniendo nombre para ${employeeId}:`, error.message);
    }

    // ============================================
    // LÍNEA 389: Retorna "DESCONOCIDO" si falló
    // ============================================
    return 'DESCONOCIDO';
  }

  // ============================================
  // LÍNEA 390: Método para guardar registros en JSON y Excel
  // ============================================
  private async saveMultipleRecords(records: AttendanceRecord[]): Promise<number> {
    // ============================================
    // LÍNEA 391: Si no hay registros, retornar 0
    // ============================================
    if (records.length === 0) return 0;

    // ============================================
    // LÍNEA 392: Obtiene registros actuales del JSON
    // ============================================
    const currentEvents = this.getSavedEvents();
    
    // ============================================
    // LÍNEA 393-398: Crea Set de claves existentes
    // Clave = empleado + fecha (para detectar duplicados)
    // ============================================
    const existingKeys = new Set(
      currentEvents.map(e => {
        const timestamp = this.normalizeDate(e.timestamp);
        return `${e.employeeId}_${timestamp.toISOString()}`;
      })
    );
    
    // ============================================
    // LÍNEA 399: Contador de registros nuevos
    // ============================================
    let newRecordsCount = 0;
    // ============================================
    // LÍNEA 400: Array para registros a agregar
    // ============================================
    const recordsToAdd: AttendanceRecord[] = [];

    // ============================================
    // LÍNEA 401: Bucle para filtrar solo registros nuevos
    // ============================================
    for (const record of records) {
      // ============================================
      // LÍNEA 402: Normaliza fecha
      // ============================================
      const timestamp = this.normalizeDate(record.timestamp);
      // ============================================
      // LÍNEA 403: Crea clave única
      // ============================================
      const key = `${record.employeeId}_${timestamp.toISOString()}`;
      
      // ============================================
      // LÍNEA 404: Si no existe, agregarlo
      // ============================================
      if (!existingKeys.has(key)) {
        // LÍNEA 405: Actualiza timestamp normalizado
        record.timestamp = timestamp;
        // LÍNEA 406: Agrega al array
        recordsToAdd.push(record);
        // LÍNEA 407: Agrega clave al Set
        existingKeys.add(key);
        // LÍNEA 408: Incrementa contador
        newRecordsCount++;
      }
    }

    // ============================================
    // LÍNEA 409: Si hay registros nuevos
    // ============================================
    if (recordsToAdd.length > 0) {
      // ============================================
      // LÍNEA 410: Combina registros viejos y nuevos
      // ============================================
      const updatedEvents = [...currentEvents, ...recordsToAdd];
      
      // ============================================
      // LÍNEA 411-415: Ordena por fecha
      // ============================================
      updatedEvents.sort((a, b) => {
        const dateA = this.normalizeDate(a.timestamp);
        const dateB = this.normalizeDate(b.timestamp);
        return dateA.getTime() - dateB.getTime();
      });
      
      // ============================================
      // LÍNEA 416: Guarda en JSON
      // ============================================
      fs.writeFileSync(this.filePath, JSON.stringify(updatedEvents, null, 2), 'utf-8');
      
      // ============================================
      // LÍNEA 417: Regenera Excel completo
      // ============================================
      await this.saveMultipleRecordsToExcel(recordsToAdd);
      
      // ============================================
      // LÍNEA 418: Log de confirmación
      // ============================================
      this.logger.log(`✅ ${newRecordsCount} registros nuevos guardados en JSON y Excel`);
    }

    // ============================================
    // LÍNEA 419: Retorna cantidad de registros nuevos
    // ============================================
    return newRecordsCount;
  }

  // ============================================
  // LÍNEA 420: Método para guardar en Excel (regenera completo)
  // ============================================
  private async saveMultipleRecordsToExcel(records: AttendanceRecord[]): Promise<void> {
    // ============================================
    // LÍNEA 421: Si no hay registros, salir
    // ============================================
    if (records.length === 0) return;
    
    // ============================================
    // LÍNEA 422: Obtiene TODOS los registros del JSON
    // ============================================
    const allRecords = this.getSavedEvents();
    
    // ============================================
    // LÍNEA 423: Crea nuevo Workbook
    // ============================================
    const workbook: any = new Workbook.Workbook();
    // ============================================
    // LÍNEA 424: Crea hoja "Marcajes"
    // ============================================
    const worksheet: any = workbook.addWorksheet('Marcajes');
    
    // ============================================
    // LÍNEA 425-431: Configura columnas
    // ============================================
    worksheet.columns = [
      { header: 'ID / Cédula', key: 'employeeId', width: 15 },
      { header: 'Nombre del Empleado', key: 'employeeName', width: 30 },
      { header: 'Fecha y Hora Local', key: 'horaLocal', width: 25 },
      { header: 'Método de Marcaje', key: 'metodoMarcaje', width: 22 },
      { header: 'Dispositivo', key: 'deviceName', width: 20 },
    ];

    // ============================================
    // LÍNEA 432: Obtiene fila header
    // ============================================
    const headerRow = worksheet.getRow(1);
    // ============================================
    // LÍNEA 433: Estilo: negrita blanca
    // ============================================
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    // ============================================
    // LÍNEA 434-438: Estilo: fondo azul
    // ============================================
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '004080' },
    };
    // ============================================
    // LÍNEA 439: Centrado
    // ============================================
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // ============================================
    // LÍNEA 440: Bucle para agregar todos los registros
    // ============================================
    for (const record of allRecords) {
      // ============================================
      // LÍNEA 441-446: Agrega fila al Excel
      // ============================================
      worksheet.addRow({
        employeeId: record.employeeId,
        employeeName: record.employeeName || 'DESCONOCIDO',
        horaLocal: record.horaLocal,
        metodoMarcaje: this.parseEventType(record.rawType),
        deviceName: record.deviceName,
      });
    }
    
    // ============================================
    // LÍNEA 447: Guarda archivo Excel
    // ============================================
    await workbook.xlsx.writeFile(this.excelFilePath);
    // ============================================
    // LÍNEA 448: Log de confirmación
    // ============================================
    this.logger.log(`📊 Excel regenerado con ${allRecords.length} registros`);
  }

  // ============================================
  // LÍNEA 449: Método para insertar registro manualmente
  // ============================================
  async insertAttendanceRecord(data: {
    employeeId: string;      // ID obligatorio
    employeeName?: string;   // Nombre opcional
    timestamp?: string | Date; // Fecha opcional
    deviceName?: string;     // Dispositivo opcional
    rawType?: string;        // Tipo opcional
  }) {
    try {
      // ============================================
      // LÍNEA 450: Convierte ID a string
      // ============================================
      const idStr = String(data.employeeId);
      // ============================================
      // LÍNEA 451: Valida que no esté vacío
      // ============================================
      if (!idStr || idStr.trim() === '' || idStr === '0') {
        throw new Error('El ID de empleado es obligatorio.');
      }

      // ============================================
      // LÍNEA 452: Obtiene nombre (del dato o consulta)
      // ============================================
      const name = data.employeeName || (await this.getEmployeeName(idStr));
      
      // ============================================
      // LÍNEA 453: Prepara fecha (dato o ahora)
      // ============================================
      const rawDate = data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString();
      // ============================================
      // LÍNEA 454: Parsea fecha a formato local
      // ============================================
      const { dateObj, horaLocal } = this.parseDeviceTimeToLocal(rawDate);
      
      // ============================================
      // LÍNEA 455: Tipo de marcaje (default: 38 = huella)
      // ============================================
      const rawCode = data.rawType || '38';
      // ============================================
      // LÍNEA 456: Dispositivo (default: SISTEMA_MANUAL)
      // ============================================
      const device = data.deviceName || 'SISTEMA_MANUAL';

      // ============================================
      // LÍNEA 457-463: Crea el registro
      // ============================================
      const record: AttendanceRecord = {
        employeeId: idStr,
        employeeName: name,
        timestamp: dateObj,
        horaLocal,
        deviceName: device,
        rawType: rawCode,
      };

      // ============================================
      // LÍNEA 464: Guarda el registro
      // ============================================
      const added = await this.saveMultipleRecords([record]);

      // ============================================
      // LÍNEA 465-473: Retorna resultado
      // ============================================
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
      return {
        success: false,
        message: 'No se pudo guardar el marcaje.',
        error: error?.message || String(error),
      };
    }
  }

  // ============================================
  // LÍNEA 474: Método para procesar eventos push (webhook)
  // ============================================
  async processEventPayload(body: any, contentType?: string): Promise<boolean> {
    try {
      let parsedData: any = body;

      // ============================================
      // LÍNEA 475: Si es XML, convertir a JSON
      // ============================================
      if (typeof body === 'string' || contentType?.includes('xml')) {
        parsedData = await this.parseXml(body);
      }

      // ============================================
      // LÍNEA 476: Extrae datos del evento
      // ============================================
      const record = this.extractAttendanceData(parsedData);

      if (record) {
        // LÍNEA 477: Obtiene nombre
        record.employeeName = await this.getEmployeeName(record.employeeId);
        // LÍNEA 478: Guarda registro
        const added = await this.saveMultipleRecords([record]);
        // LÍNEA 479: Retorna si se guardó
        return added > 0;
      }

      return false;
    } catch (error) {
      this.logger.error('Error procesando evento PUSH:', error);
      return false;
    }
  }

  // ============================================
  // LÍNEA 480: Método para obtener eventos formateados
  // ============================================
  getFormattedEvents(employeeIdFilter?: string) {
    // ============================================
    // LÍNEA 481: Verifica si existe el archivo
    // ============================================
    if (!fs.existsSync(this.filePath)) {
      return { totalRecords: 0, events: [] };
    }

    // ============================================
    // LÍNEA 482: Lee el archivo JSON
    // ============================================
    const fileData = fs.readFileSync(this.filePath, 'utf-8');
    // ============================================
    // LÍNEA 483: Parsea a array (o vacío si no hay datos)
    // ============================================
    let records: AttendanceRecord[] = fileData ? JSON.parse(fileData) : [];

    // ============================================
    // LÍNEA 484: Filtra por empleado si se especifica
    // ============================================
    if (employeeIdFilter) {
      records = records.filter((r) => r.employeeId === employeeIdFilter);
    }

    // ============================================
    // LÍNEA 485-496: Ordena (más reciente primero) y formatea
    // ============================================
    const formattedEvents = records
      .sort((a, b) => {
        const dateA = this.normalizeDate(a.timestamp);
        const dateB = this.normalizeDate(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      })
      .map((r) => ({
        empleadoId: r.employeeId,
        nombre: r.employeeName || 'DESCONOCIDO',
        metodoMarcaje: this.parseEventType(r.rawType),
        horaLocal: r.horaLocal,
        timestampISO: this.normalizeDate(r.timestamp),
        dispositivo: r.deviceName,
      }));

    // ============================================
    // LÍNEA 497-500: Retorna eventos formateados
    // ============================================
    return {
      totalRecords: formattedEvents.length,
      events: formattedEvents,
    };
  }

  // ============================================
  // LÍNEA 501: Método para obtener eventos guardados del JSON
  // ============================================
  getSavedEvents(): AttendanceRecord[] {
    // ============================================
    // LÍNEA 502: Verifica si existe el archivo
    // ============================================
    if (!fs.existsSync(this.filePath)) return [];
    
    // ============================================
    // LÍNEA 503: Lee el archivo
    // ============================================
    const fileData = fs.readFileSync(this.filePath, 'utf-8');
    // ============================================
    // LÍNEA 504: Si está vacío, retornar array vacío
    // ============================================
    if (!fileData) return [];
    
    try {
      // ============================================
      // LÍNEA 505: Parsea JSON
      // ============================================
      const records = JSON.parse(fileData);
      
      // ============================================
      // LÍNEA 506-509: Normaliza timestamps a Date
      // ============================================
      return records.map((r: any) => ({
        ...r,
        timestamp: this.normalizeDate(r.timestamp)
      }));
    } catch (error) {
      this.logger.error('Error parseando marcajes.json:', error);
      return [];
    }
  }

  // ============================================
  // LÍNEA 510: Método para exportar JSON detallado
  // ============================================
  async exportDetailedJson() {
    // ============================================
    // LÍNEA 511: Obtiene todos los eventos
    // ============================================
    const events = this.getSavedEvents();
    
    // ============================================
    // LÍNEA 512-518: Formatea registros
    // ============================================
    const detailed = events.map(e => ({
      empleadoId: e.employeeId,
      nombreCompleto: e.employeeName || 'DESCONOCIDO',
      metodoMarcaje: this.parseEventType(e.rawType),
      horaLocal: e.horaLocal,
      dispositivo: e.deviceName
    }));

    // ============================================
    // LÍNEA 519: Ruta del archivo exportado
    // ============================================
    const exportPath = path.join(process.cwd(), 'marcajes_con_nombres.json');
    // ============================================
    // LÍNEA 520: Guarda archivo
    // ============================================
    fs.writeFileSync(exportPath, JSON.stringify(detailed, null, 2), 'utf-8');
    
    // ============================================
    // LÍNEA 521-525: Retorna resultado
    // ============================================
    return {
      success: true,
      message: `Archivo exportado a ${exportPath}`,
      total: detailed.length,
      data: detailed
    };
  }

  // ============================================
  // LÍNEA 526: Método para extraer datos del payload
  // ============================================
  private extractAttendanceData(payload: any): AttendanceRecord | null {
    // ============================================
    // LÍNEA 527-529: Obtiene el evento del payload
    // ============================================
    const event =
      payload?.AccessControllerEvent ||
      payload?.EventNotificationAlert?.AccessControllerEvent;
    if (!event) return null;

    // ============================================
    // LÍNEA 530: Convierte minor a número
    // ============================================
    const minor = Number(event.minor);
    // ============================================
    // LÍNEA 531: Convierte major a número
    // ============================================
    const major = Number(event.major);
    
    // ============================================
    // LÍNEA 532: Lista de events del sistema
    // ============================================
    const systemEventMinors = [49, 50, 51, 52, 53, 54, 55];
    // ============================================
    // LÍNEA 533-535: Si es del sistema, retornar null
    // ============================================
    if (systemEventMinors.includes(minor)) {
      return null;
    }

    // ============================================
    // LÍNEA 536-538: Si major no es 5, retornar null
    // ============================================
    if (major !== 5) {
      return null;
    }

    // ============================================
    // LÍNEA 539: Obtiene ID del empleado
    // ============================================
    const employeeId = event.employeeNoString || event.employeeNo;
    // ============================================
    // LÍNEA 540-542: Valida que no esté vacío
    // ============================================
    if (!employeeId || String(employeeId).trim() === '' || employeeId === '0') {
      return null;
    }

    // ============================================
    // LÍNEA 543: Obtiene fecha del evento
    // ============================================
    const timeStr = event.time || payload?.EventNotificationAlert?.dateTime;
    // ============================================
    // LÍNEA 544: Obtiene nombre del dispositivo
    // ============================================
    const deviceName = event.deviceName || 'HIKVISION_DS-K1A8503MF';

    // ============================================
    // LÍNEA 545: Si no hay fecha, retornar null
    // ============================================
    if (!timeStr) return null;

    // ============================================
    // LÍNEA 546: Parsea fecha
    // ============================================
    const { dateObj, horaLocal } = this.parseDeviceTimeToLocal(timeStr);

    // ============================================
    // LÍNEA 547-553: Retorna el registro
    // ============================================
    return {
      employeeId: String(employeeId),
      timestamp: dateObj,
      horaLocal,
      deviceName,
      rawType: String(event.eventType || minor || 'AccessControl'),
    };
  }

  // ============================================
  // LÍNEA 554: Método para parsear XML a JSON
  // ============================================
  private parseXml(xmlString: string): Promise<any> {
    // ============================================
    // LÍNEA 555-560: Usa xml2js para convertir
    // ============================================
    return new Promise((resolve, reject) => {
      xml2js.parseString(xmlString, { explicitArray: false }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // ============================================
  // LÍNEA 561: Método para limpiar caché de empleados
  // ============================================
  clearEmployeeCache(): void {
    // ============================================
    // LÍNEA 562: Limpia el Map
    // ============================================
    this.employeeMap.clear();
    // ============================================
    // LÍNEA 563: Log de confirmación
    // ============================================
    this.logger.log('🧹 Caché de empleados limpiada');
  }

  // ============================================
  // LÍNEA 564: Método para obtener registros ordenados por fecha
  // ============================================
  getAllRecordsOrderedByDate() {
    // ============================================
    // LÍNEA 565: Obtiene todos los eventos
    // ============================================
    const events = this.getSavedEvents();
    
    // ============================================
    // LÍNEA 566-570: Ordena por fecha
    // ============================================
    const sortedEvents = events.sort((a, b) => {
      const dateA = this.normalizeDate(a.timestamp);
      const dateB = this.normalizeDate(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });
    
    // ============================================
    // LÍNEA 571: Objeto para agrupar por fecha
    // ============================================
    const grouped: any = {};
    
    // ============================================
    // LÍNEA 572: Bucle para agrupar
    // ============================================
    sortedEvents.forEach(record => {
      // LÍNEA 573: Normaliza fecha
      const timestamp = this.normalizeDate(record.timestamp);
      // LÍNEA 574-578: Obtiene clave de fecha
      const dateKey = timestamp.toLocaleDateString('es-VE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      
      // LÍNEA 579: Si no existe el grupo, crearlo
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          // LÍNEA 580-586: Fecha legible
          fecha: timestamp.toLocaleDateString('es-VE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          totalMarcajes: 0,
          marcajes: []
        };
      }
      
      // LÍNEA 587: Incrementa contador
      grouped[dateKey].totalMarcajes++;
      // LÍNEA 588-595: Agrega marcaje al grupo
      grouped[dateKey].marcajes.push({
        empleadoId: record.employeeId,
        nombre: record.employeeName || 'DESCONOCIDO',
        horaLocal: record.horaLocal,
        timestampISO: timestamp,
        metodoMarcaje: this.parseEventType(record.rawType),
        dispositivo: record.deviceName,
      });
    });
    
    // LÍNEA 596: Ordena las fechas
    const sortedDates = Object.keys(grouped).sort();
    
    // LÍNEA 597-604: Retorna resultado
    return {
      totalRegistros: sortedEvents.length,
      totalDias: sortedDates.length,
      registrosPorFecha: sortedDates.map(key => ({
        fecha: grouped[key].fecha,
        totalMarcajes: grouped[key].totalMarcajes,
        marcajes: grouped[key].marcajes
      }))
    };
  }

    /**
   * 📥 IMPORTACIÓN MASIVA DE USUARIOS DESDE EXCEL
   * Lee un archivo Excel con columnas: Cédula, Nombre, Apellido, Cargo
   * y crea los usuarios en el biométrico automáticamente.
   */
    async importUsersFromExcel(
    excelPath: string,
    ip: string = '172.18.0.89',
    user: string = 'admin',
    pass: string = 'Dtd2026*',
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
        fallidos: 0,
        errores: [] as string[],
      };

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const cedula = row.getCell(1).value?.toString().trim() || '';
        const nombre = row.getCell(2).value?.toString().trim() || '';
        const apellido = row.getCell(3).value?.toString().trim() || '';
        const cargo = row.getCell(4).value?.toString().trim() || 'EMPLEADO';

        if (!cedula) continue;

        resultados.totalFilas++;
        const nombreCompleto = `${nombre} ${apellido}`.trim();
        const userType = cargo.toLowerCase().includes('admin') ? 'admin' : 'normal';

        //  FECHAS DINÁMICAS
        const fechaActual = new Date();
        const fechaFin = new Date();
        fechaFin.setFullYear(fechaFin.getFullYear() + 10); // Válido por 10 años

        const payloadObj = {
          UserInfo: {
            employeeNo: cedula,
            name: nombreCompleto,
            userType: userType,
            employeeGroup: cargo,   // Guarda el cargo/departamento
            valid: {
              enable: true,
              beginTime: fechaActual.toISOString().slice(0, 19), // ahora
              endTime: fechaFin.toISOString().slice(0, 19),      // +10 años
            },
          },
        };

        const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
        const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X POST -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Record?format=json`;

        try {
          const { stdout } = await execPromise(command, { timeout: 10000 });
          if (stdout) {
            const response = JSON.parse(stdout);
            if (response?.statusCode === 1 || response?.statusString === 'OK') {
              resultados.creados++;
              this.logger.log(`✅ Usuario creado: ${cedula} - ${nombreCompleto} (${cargo})`);
            } else {
              resultados.fallidos++;
              resultados.errores.push(`Error con ${cedula}: ${JSON.stringify(response)}`);
              this.logger.warn(`⚠️ No se pudo crear ${cedula}: ${JSON.stringify(response)}`);
            }
          }
        } catch (error: any) {
          resultados.fallidos++;
          resultados.errores.push(`Error con ${cedula}: ${error.message}`);
          this.logger.error(`❌ Error creando ${cedula}: ${error.message}`);
        }

        await this.delay(200);
      }

      this.logger.log(`📊 Importación finalizada: ${resultados.creados} creados, ${resultados.fallidos} fallidos`);
      return { success: true, message: 'Importación masiva completada', ...resultados };
    } catch (error: any) {
      this.logger.error('Error en importación masiva:', error.message);
      return { success: false, message: 'Error al importar usuarios', error: error.message };
    }
  }

    async listUsers(ip = '172.18.0.89', user = 'admin', pass = 'Dtd2026*') {
      const payloadObj = {
        UserInfoSearchCond: {
          searchID: '1',
          searchResultPosition: 0,
          maxResults: 100,
        },
      };
      const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
      const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X POST -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Search?format=json`;
      const { stdout } = await execPromise(command, { timeout: 10000 });
      const data = JSON.parse(stdout);

      const usuarios = data?.UserInfoSearch?.UserInfo || [];
      const activos = usuarios.filter(u => u.Valid?.enable !== false);

      return {
        success: true,
        totalUsuarios: activos.length,
        usuarios: activos.map(u => ({
          employeeNo: u.employeeNo,
          name: u.name,
          userType: u.userType,
          userGroup: u.userGroup || '',
        })),
      };
    }

    /**
   * Desactiva al USUARIO DEL BIOMÉTRICO
   * Recibe la cédula (employeeNo) y elimina el usuario del dispositivo.
   */
      async deleteUserFromDevice(
    employeeNo: string,
    ip: string = '172.18.0.89',
    user: string = 'admin',
    pass: string = 'Dtd2026*',
  ) {
    try {
      // Obtener nombre actual para no perderlo en la modificación
      const currentUser = await this.getUserByEmployeeNo(employeeNo, ip, user, pass);
      const nombreActual = currentUser?.name || 'DESCONOCIDO';
      const userTypeActual = currentUser?.userType || 'normal';

      const payloadObj = {
        UserInfo: {
          employeeNo: employeeNo,
          name: nombreActual,
          userType: userTypeActual,
          Valid: {
            enable: false,   // ❌ Desactivar
            beginTime: '2026-01-01T00:00:00',
            endTime: '2036-01-01T23:59:59',
          },
        },
      };

      const payloadStr = JSON.stringify(payloadObj).replace(/"/g, '\\"');
      const command = `curl --digest -u ${user}:${pass} -H "Content-Type: application/json" -X PUT -d "${payloadStr}" http://${ip}/ISAPI/AccessControl/UserInfo/Modify?format=json`;

      const { stdout } = await execPromise(command, { timeout: 10000 });

      if (stdout) {
        const response = JSON.parse(stdout);
        if (response?.statusCode === 1 || response?.statusString === 'OK') {
          this.logger.log(`✅ Usuario ${employeeNo} desactivado correctamente`);
          return {
            success: true,
            message: `Usuario ${employeeNo} desactivado (no podrá marcar)`,
          };
        } else {
          this.logger.warn(`⚠️ No se pudo desactivar ${employeeNo}: ${JSON.stringify(response)}`);
          return {
            success: false,
            message: 'No se pudo desactivar el usuario',
            detail: response,
          };
        }
      }
    } catch (error: any) {
      this.logger.error(`Error desactivando ${employeeNo}: ${error.message}`);
      return {
        success: false,
        message: 'Error al desactivar el usuario',
        error: error.message,
      };
    }
  }

   // ============================================
  // 🔐 PREPARAR USUARIO PARA REGISTRAR HUELLA
  // Busca al usuario por cédula y lo deja listo
  // para que enrolle su huella en el biométrico
  // ============================================
    /**
   * 🔐 PREPARAR USUARIO PARA REGISTRAR HUELLA
   * Activa al usuario y lo marca como pendiente
   * La captura de huella se hace en el biométrico
   */
  async prepareUserForFingerprint(
    employeeNo: string,
    ip: string = '172.18.0.89',
    user: string = 'admin',
    pass: string = 'Dtd2026*',
  ) {
    try {
      // 1. Buscar al usuario
      const currentUser = await this.getUserByEmployeeNo(employeeNo, ip, user, pass);
      if (!currentUser) {
        return { success: false, message: 'Usuario no encontrado en el biométrico' };
      }

      // 2. Activar al usuario (sin tocar userVerifyMode)
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
        // 3. Agregar a pendientes localmente
        this.addToPendingFingerprintList(employeeNo);
        return {
          success: true,
          message: `Usuario ${employeeNo} activado y listo para registrar huella en el biométrico`,
        };
      } else {
        return {
          success: false,
          message: 'No se pudo activar al usuario',
          detail: response,
        };
      }
    } catch (error: any) {
      return { success: false, message: 'Error al preparar usuario', error: error.message };
    }
  }

  // ============================================
  // 📝 AGREGAR A LISTA DE PENDIENTES DE HUELLA
  // Guarda en un JSON local las cédulas pendientes
  // ============================================
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

  // ========== AUXILIAR ==========
  private addToPendingFingerprintList(employeeNo: string) {
    const pendingPath = path.join(process.cwd(), 'pendientes_huella.json');
    let pendientes : string[] = [];
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

    /**
   * Obtener hora actual del biométrico
   */
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


}