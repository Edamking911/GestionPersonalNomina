import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { BiometricoService } from './biometrico.service';
import type { Request } from 'express';

@ApiTags('Biométrico')
@Controller('biometrico')
export class BiometricoController {
  constructor(private readonly biometricoService: BiometricoService) {}

  /**
   * Sincronización automática (solo hoy)
   */
  @Get('sync')
  @ApiOperation({
    summary: 'Sincronización automática (hoy)',
    description:
      'Sincroniza marcajes del día actual desde el dispositivo biométrico',
  })
  @ApiResponse({ status: 200, description: 'Sincronización completada' })
  @ApiResponse({ status: 500, description: 'Error al sincronizar' })
  async syncDevice() {
    return await this.biometricoService.syncLogsFromDevice();
  }

  /**
   * Sincronización completa con paginación (últimos 30 días)
   */
  @Get('sync-all')
  @ApiOperation({
    summary: 'Sincronización completa (últimos 30 días)',
    description:
      'Sincroniza todos los marcajes de los últimos 30 días con paginación',
  })
  @ApiResponse({
    status: 200,
    description: 'Sincronización completa finalizada',
  })
  @ApiResponse({ status: 500, description: 'Error al sincronizar' })
  async syncAll() {
    return await this.biometricoService.syncAllLogsFromDevice();
  }

  /**
   * Sincronización por rango de fechas específico
   */
  @Post('sync-range')
  @ApiOperation({
    summary: 'Sincronización por rango de fechas',
    description:
      'Sincroniza marcajes en un rango de fechas específico o últimos N días',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date',
          example: '2026-08-01',
          description: 'Fecha inicio (YYYY-MM-DD)',
        },
        endDate: {
          type: 'string',
          format: 'date',
          example: '2026-08-31',
          description: 'Fecha fin (YYYY-MM-DD)',
        },
        daysBack: {
          type: 'number',
          example: 7,
          description: 'Días hacia atrás desde hoy',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Sincronización por rango completada',
  })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 500, description: 'Error al sincronizar' })
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
  @ApiOperation({
    summary: 'Sincronizar marcajes de ayer',
    description: 'Sincroniza automáticamente los marcajes del día anterior',
  })
  @ApiResponse({
    status: 200,
    description: 'Sincronización de ayer completada',
  })
  @ApiResponse({ status: 500, description: 'Error al sincronizar' })
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
  @ApiOperation({
    summary: 'Obtener eventos filtrados',
    description: 'Retorna eventos con filtro opcional por ID de empleado',
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    description: 'ID del empleado para filtrar',
    example: '29789773',
  })
  @ApiResponse({ status: 200, description: 'Eventos obtenidos exitosamente' })
  @ApiResponse({ status: 500, description: 'Error al obtener eventos' })
  getEvents(@Query('employeeId') employeeId?: string) {
    return this.biometricoService.getFormattedEvents(employeeId);
  }

  /**
   * Obtener todos los registros ordenados por fecha
   */
  @Get('all-records')
  @ApiOperation({
    summary: 'Obtener todos los registros ordenados',
    description: 'Retorna todos los registros de marcajes ordenados por fecha',
  })
  @ApiResponse({ status: 200, description: 'Registros obtenidos exitosamente' })
  @ApiResponse({ status: 500, description: 'Error al obtener registros' })
  async getAllRecords() {
    return this.biometricoService.getAllRecordsOrderedByDate();
  }

  /**
   * Obtener registros agrupados por fecha
   */
  @Get('records-by-date')
  @ApiOperation({
    summary: 'Obtener registros agrupados por fecha',
    description:
      'Retorna registros agrupados por fecha con filtro opcional por empleado',
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    description: 'ID del empleado para filtrar',
    example: '29789773',
  })
  @ApiResponse({
    status: 200,
    description: 'Registros agrupados obtenidos exitosamente',
  })
  @ApiResponse({ status: 500, description: 'Error al obtener registros' })
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
  @ApiOperation({
    summary: 'Obtener estadísticas generales',
    description:
      'Retorna estadísticas consolidadas de marcajes (total, por día, por empleado)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  @ApiResponse({ status: 500, description: 'Error al obtener estadísticas' })
  async getStats() {
    return this.biometricoService.getStats();
  }

  /**
   * Verificar estado del Excel
   */
  @Get('check-excel')
  @ApiOperation({
    summary: 'Verificar estado del archivo Excel',
    description:
      'Verifica si el archivo Excel existe y retorna información detallada',
  })
  @ApiResponse({ status: 200, description: 'Estado del Excel obtenido' })
  @ApiResponse({ status: 500, description: 'Error al verificar Excel' })
  async checkExcel() {
    return await this.biometricoService.checkExcelStatus();
  }

  /**
   * Limpiar registros duplicados
   */
  @Get('clean-duplicates')
  @ApiOperation({
    summary: 'Limpiar registros duplicados',
    description:
      'Elimina registros duplicados basándose en empleado y timestamp',
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicados eliminados exitosamente',
  })
  @ApiResponse({ status: 500, description: 'Error al limpiar duplicados' })
  async cleanDuplicates() {
    return await this.biometricoService.cleanDuplicates();
  }

  /**
   * Exportar todos los datos en JSON detallado
   */
  @Get('export-json')
  @ApiOperation({
    summary: 'Exportar datos en JSON',
    description: 'Exporta todos los marcajes en formato JSON detallado',
  })
  @ApiResponse({ status: 200, description: 'Datos exportados exitosamente' })
  @ApiResponse({ status: 500, description: 'Error al exportar' })
  async exportJson() {
    return await this.biometricoService.exportDetailedJson();
  }

  /**
   * Insertar marcaje manualmente
   */
  @Post('manual')
  @ApiOperation({
    summary: 'Insertar marcaje manual',
    description: 'Permite insertar un marcaje manualmente en el sistema',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        employeeId: { type: 'string', example: '29789773' },
        employeeName: { type: 'string', example: 'JUAN PEREZ' },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2026-08-28T10:00:00.000Z',
        },
        deviceName: { type: 'string', example: 'DS-K1A8503MF' },
        rawType: { type: 'string', example: '38' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Marcaje insertado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 500, description: 'Error al insertar' })
  async insertManual(@Body() body: any) {
    return await this.biometricoService.insertAttendanceRecord(body);
  }

  /**
   * Webhook para eventos push del biométrico
   */
  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook para eventos push',
    description:
      'Recibe eventos push del dispositivo biométrico en tiempo real',
  })
  @ApiResponse({ status: 200, description: 'Evento procesado' })
  @ApiResponse({ status: 500, description: 'Error al procesar evento' })
  async handleWebhook(@Req() req: Request) {
    const contentType = req.headers['content-type'];
    const success = await this.biometricoService.processEventPayload(
      req.body,
      contentType,
    );
    return { success };
  }

  /**
   * Limpiar caché de empleados
   */
  @Get('clear-cache')
  @ApiOperation({
    summary: 'Limpiar caché de empleados',
    description: 'Limpia la caché interna de nombres de empleados',
  })
  @ApiResponse({ status: 200, description: 'Caché limpiada exitosamente' })
  @ApiResponse({ status: 500, description: 'Error al limpiar caché' })
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
  @Get('device-info')
  @ApiOperation({
    summary: 'Obtener información del dispositivo',
    description:
      'Consulta información del dispositivo biométrico (modelo, firmware, MAC, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del dispositivo obtenida',
  })
  @ApiResponse({ status: 500, description: 'Error al obtener información' })
  async getDeviceInfo() {
    return await this.biometricoService.getDeviceInfo();
  }
}
