import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { BiometricoService } from './biometrico.service';
import type { Request } from 'express';

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
  async syncRange(@Body() body: { startDate?: string; endDate?: string; daysBack?: number }) {
    return await this.biometricoService.syncLogsFromDevice(
      '172.18.0.89',
      'admin',
      'Dtd2026*',
      {
        startDate: body.startDate,
        endDate: body.endDate,
        daysBack: body.daysBack,
      }
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
      }
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
        registrosPorFecha: []
      };
      
      allRecords.registrosPorFecha.forEach((fecha: any) => {
        const marcajesFiltrados = fecha.marcajes.filter(
          (m: any) => m.empleadoId === employeeId
        );
        
        if (marcajesFiltrados.length > 0) {
          filtered.registrosPorFecha.push({
            fecha: fecha.fecha,
            totalMarcajes: marcajesFiltrados.length,
            marcajes: marcajesFiltrados
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
    const success = await this.biometricoService.processEventPayload(req.body, contentType);
    return { success };
  }

  /**
   * Limpiar caché de empleados
   */
  @Get('clear-cache')
  async clearCache() {
    this.biometricoService.clearEmployeeCache();
    return { 
      success: true, 
      message: 'Caché de empleados limpiada exitosamente' 
    };
  }

  /**
   * Obtener información del dispositivo biométrico
   */
  @Get('device-info')
  async getDeviceInfo() {
    return await this.biometricoService.getDeviceInfo();
  }
}