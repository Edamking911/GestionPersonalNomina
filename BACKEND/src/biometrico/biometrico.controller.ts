import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  Delete,
  Param, UploadedFile, 
  UseInterceptors,
} from '@nestjs/common';
import { BiometricoService } from './biometrico.service';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';



@Controller('biometrico')
export class BiometricoController {
  constructor(private readonly biometricoService: BiometricoService) {}

  /**
   * Sincronización automática (solo hoy)
   */
  @Get('sync')
  async syncDevice() {
    return await this.biometricoService.syncLogsFromDevice();
  }

  /**
   * Sincronización completa con paginación (últimos 30 días)
   */
  @Get('sync-all')
  async syncAll() {
    return await this.biometricoService.syncAllLogsFromDevice();
  }

  /**
   * Sincronización por rango de fechas específico
   */
  @Post('sync-range')
  async syncRange(
    @Body() body: { startDate?: string; endDate?: string; daysBack?: number },
  ) {
    return await this.biometricoService.syncLogsFromDevice(
      '172.18.0.89',
      'admin',
      'Dtd2026*',
      {
        startDate: body.startDate,
        endDate: body.endDate,
        daysBack: body.daysBack,
      },
    );
  }

  /**
   * Sincronizar marcajes de ayer
   */
  @Post('sync-yesterday')
  async syncYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return await this.biometricoService.syncLogsFromDevice(
      '172.18.0.89',
      'admin',
      'Dtd2026*',
      {
        startDate: yesterdayStr,
        endDate: yesterdayStr,
      },
    );
  }

  /**
   * Obtener todos los eventos con filtro opcional por empleado
   */
  @Get('events')
  getEvents(@Query('employeeId') employeeId?: string) {
    return this.biometricoService.getFormattedEvents(employeeId);
  }

  /**
   * Obtener todos los registros ordenados por fecha
   */
  @Get('all-records')
  async getAllRecords() {
    return this.biometricoService.getAllRecordsOrderedByDate();
  }

  /**
   * Obtener registros agrupados por fecha
   */
  @Get('records-by-date')
  async getRecordsByDate(@Query('employeeId') employeeId?: string) {
    const allRecords: any = this.biometricoService.getAllRecordsOrderedByDate();

    if (employeeId) {
      const filtered: any = {
        totalRegistros: 0,
        totalDias: 0,
        registrosPorFecha: [],
      };

      allRecords.registrosPorFecha.forEach((fecha: any) => {
        const marcajesFiltrados = fecha.marcajes.filter(
          (m: any) => m.empleadoId === employeeId,
        );

        if (marcajesFiltrados.length > 0) {
          filtered.registrosPorFecha.push({
            fecha: fecha.fecha,
            totalMarcajes: marcajesFiltrados.length,
            marcajes: marcajesFiltrados,
          });
          filtered.totalRegistros += marcajesFiltrados.length;
        }
      });

      filtered.totalDias = filtered.registrosPorFecha.length;
      return filtered;
    }

    return allRecords;
  }

  /**
   * Obtener estadísticas generales
   */
  @Get('stats')
  async getStats() {
    return this.biometricoService.getStats();
  }

  /**
   * Verificar estado del Excel
   */
  @Get('check-excel')
  async checkExcel() {
    return await this.biometricoService.checkExcelStatus();
  }

  /**
   * Limpiar registros duplicados
   */
  @Get('clean-duplicates')
  async cleanDuplicates() {
    return await this.biometricoService.cleanDuplicates();
  }

  /**
   * Exportar todos los datos en JSON detallado
   */
  @Get('export-json')
  async exportJson() {
    return await this.biometricoService.exportDetailedJson();
  }

  /**
   * Insertar marcaje manualmente
   */
  @Post('manual')
  async insertManual(@Body() body: any) {
    return await this.biometricoService.insertAttendanceRecord(body);
  }

  /**
   * Webhook para eventos push del biométrico
   */
  @Post('webhook')
  async handleWebhook(@Req() req: Request) {
    const contentType = req.headers['content-type'];
    const success = await this.biometricoService.processEventPayload(
      req.body,
      contentType,
    );
    return { success };
  }

  /* 📥 Importar usuarios desde Excel
   * Body: { "filePath": "C:\\ruta\\al\\archivo.xlsx" }
   * El Excel debe tener las columnas: Cédula, Nombre, Apellido, Cargo
   */
  @Post('import-users')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const tempDir = path.join(process.cwd(), 'temp');
          if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
          cb(null, tempDir);
        },
        filename: (_req, file, cb) => {
          const timestamp = Date.now();
          cb(null, `usuarios_${timestamp}_${file.originalname}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ok = /\.(xlsx|xls)$/i.test(file.originalname);
        if (!ok) return cb(new Error('Solo se permiten archivos .xlsx o .xls'), false);
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { success: false, message: 'No se recibió ningún archivo' };
    }

    try {
      const resultado = await this.biometricoService.importUsersFromExcel(file.path);
      return resultado;
    } finally {
      // 🔑 Borrar el archivo temporal después de procesarlo
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
  }

  /**
   * Limpiar caché de empleados
   */
  @Get('clear-cache')
  async clearCache() {
    this.biometricoService.clearEmployeeCache();
    return {
      success: true,
      message: 'Caché de empleados limpiada exitosamente',
    };
  }

  /**
   * Obtener información del dispositivo biométrico
   */
  @Get('status')
  async getStatus() {
    const result = await this.biometricoService.getDeviceInfo();
    return {
      online: result.success,
      ...(result.success ? { deviceInfo: result.deviceInfo } : { message: result.message })
    };
  }

  @Get('list-users')
  async listUsers(@Query('incluirInactivos') incluirInactivos?: string) {
    const incluir = incluirInactivos === 'true';
    return await this.biometricoService.listUsers(
      '172.18.0.89',
      'admin',
      'Dtd2026*',
      incluir,  // 👈 CLAVE
    );
  }

  /**
   * Eliminar usuario del biométrico
   * Ejemplo: DELETE /biometrico/delete-user/16335012
   */
  @Delete('delete-user/:employeeNo')
  async deleteUser(@Param('employeeNo') employeeNo: string) {
    return await this.biometricoService.deleteUserFromDevice(employeeNo);
  }

    /**
   * Activar usuario previamente desactivado
   * Ejemplo: POST /biometrico/activate-user/16335012
   */
  @Post('activate-user/:employeeNo')
  async activateUser(@Param('employeeNo') employeeNo: string) {
    return await this.biometricoService.activateUserInDevice(employeeNo);
  }

  /**
   * 🔐 Preparar usuario para registrar huella
   * POST /biometrico/prepare-fingerprint/12345
   */
  @Post('prepare-fingerprint/:employeeNo')
  async prepareFingerprint(@Param('employeeNo') employeeNo: string) {
    return await this.biometricoService.prepareUserForFingerprint(employeeNo);
  }

  @Post('remove-pending/:employeeNo')
  async removePending(@Param('employeeNo') employeeNo: string) {
    return this.biometricoService.removeFromPendingFingerprintList(employeeNo);
  }

  @Get('pending-fingerprint')
  async pendingFingerprint() {
    const pendientes = await this.biometricoService.listPendingFingerprint();
    return { success: true, pendientes };
  }

  /**
   * Obtener marcajes de una fecha específica
   * GET /biometrico/marcajes/:fecha
   */
  @Get('marcajes/:fecha')
  async getMarcajesPorFecha(@Param('fecha') fecha: string) {
    return await this.biometricoService.getMarcajesPorFecha(fecha);
  }

  @Get('list-all-users')
  async listAllUsers() {
    return await this.biometricoService.listUsers(
      '172.18.0.89',
      'admin',
      'Dtd2026*',
      true, // incluirInactivos = true
    );
  }
}
