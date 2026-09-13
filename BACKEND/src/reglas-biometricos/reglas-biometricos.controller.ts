import {Controller, Get, Post, Body, Param, Query,UploadedFile, UseInterceptors, BadRequestException} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReglasBiometricosService } from './reglas-biometricos.service';
import 'multer';
@Controller('reglas')
export class ReglasBiometricosController {
  constructor(private readonly reglasService: ReglasBiometricosService) {}

  @Get()
  getReglas() {
    return this.reglasService.getReglas();
  }

  @Get('asignaciones')
  async getAsignaciones(
    @Query('semana') semana?: string,
    @Query('generarExcel') generarExcel?: string,
  ) {
    const conExcel = generarExcel === 'true';
    return await this.reglasService.getAsignaciones(semana, conExcel);
  }

  @Get('dias-libres')
  getDiasLibres() {
    return this.reglasService.getDiasLibres();
  }

  @Post('asignar')
  async asignarHorario(@Body() body: { employeeId: string; horarioId: string; diasLibresFijos?: string[] }) {
    return await this.reglasService.asignarHorario(
      body.employeeId,
      body.horarioId,
      body.diasLibresFijos,
    );
  }

  @Post('asignar-dias-libres')
  asignarDiasLibres(
    @Body() body: { employeeId: string; semana: string; diasLibres: string[] },
  ) {
    return this.reglasService.asignarDiasLibres(
      body.employeeId,
      body.semana,
      body.diasLibres,
    );
  }

  @Post('validar-salidas')
  async validarSalidas(@Body() body: { fecha?: string; generarExcel?: boolean }) {
    const fechaStr = body.fecha || new Date().toISOString().slice(0, 10);
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    return await this.reglasService.validarSalidasPendientes(fecha, body.generarExcel);
  }

  @Get('evaluar/:employeeId/:fecha')
  async evaluarEmpleado(
    @Param('employeeId') employeeId: string,
    @Param('fecha') fecha: string,
  ) {
    try {
      const [year, month, day] = fecha.split('-').map(Number);
      const fechaLocal = new Date(year, month - 1, day);
      return await this.reglasService.evaluarEmpleado(employeeId, fechaLocal);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'No se pudo evaluar al empleado.',
      };
    }
  }

  @Get('reporte/:fecha')
  async reporteDiario(
    @Param('fecha') fecha: string,
    @Query('generarExcel') generarExcel?: string,
  ) {
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaLocal = new Date(year, month - 1, day);
    const conExcel = generarExcel === 'true';
    return await this.reglasService.generarReporteDiario(fechaLocal, conExcel);
  }
  // GENERA PLANTILLA PARA LAS ASIGNACIONES 
  @Get('plantilla-asignaciones')
  async plantillaAsignaciones(@Query('mes') mes?: string) {
    return await this.reglasService.generarPlantillaAsignaciones(mes);
  }

  @Post('validar-excel-asignaciones')
  @UseInterceptors(FileInterceptor('file'))
  async validarExcelAsignaciones(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }
    return await this.reglasService.validarExcelAsignaciones(file.buffer);
  }
  /**
   * ✅ Importa un Excel de asignaciones y aplica cambios
   * POST /reglas/importar-excel-asignaciones
   */
  @Post('importar-excel-asignaciones')
  @UseInterceptors(FileInterceptor('file'))
  async importarExcelAsignaciones(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }
    return await this.reglasService.importarExcelAsignaciones(file.buffer);
  }


    /**
   * 📋 Listar backups disponibles
   * GET /reglas/backups
   */
  @Get('backups')
  listarBackups() {
    return this.reglasService.listarBackups();
  }

    /**
   * 🔄 Restaurar un backup específico
   * POST /reglas/rollback
   * Body: { "nombre": "backup_2026-09-11T15-44-11-391Z.json" }
   */
  @Post('rollback')
  restaurarBackup(@Body() body: { nombre: string }) {
    if (!body?.nombre) {
      throw new BadRequestException('Debes enviar el nombre del backup');
    }
    return this.reglasService.restaurarBackup(body.nombre);
  }

    /**
   * 🔄 Restaurar el último backup automáticamente
   * POST /reglas/rollback-ultimo
   */
  @Post('rollback-ultimo')
  restaurarUltimoBackup() {
    return this.reglasService.restaurarUltimoBackup();
  }

    /**
   * 📊 Reporte semanal/mensual consolidado entre dos fechas
   * GET /reglas/reporte-semanal?desde=2026-09-08&hasta=2026-09-14
   * GET /reglas/reporte-semanal?desde=2026-09-08&hasta=2026-09-14&generarExcel=true
   */
  @Get('reporte-semanal')
  async reporteSemanal(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Query('generarExcel') generarExcel?: string,
  ) {
    if (!desde || !hasta) {
      throw new BadRequestException(
        'Debes enviar los parámetros "desde" y "hasta" en formato YYYY-MM-DD',
      );
    }

    const [yD, mD, dD] = desde.split('-').map(Number);
    const [yH, mH, dH] = hasta.split('-').map(Number);

    const fechaDesde = new Date(yD, mD - 1, dD);
    const fechaHasta = new Date(yH, mH - 1, dH);

    const conExcel = generarExcel === 'true';
    return await this.reglasService.generarReporteSemanal(
      fechaDesde,
      fechaHasta,
      conExcel,
    );
  }
    /**
   * Limpieza manual de backups viejos
   * GET /reglas/limpiar-backups
   * GET /reglas/limpiar-backups?dias=15
   */
  @Get('limpiar-backups')
  limpiarBackups(@Query('dias') dias?: string) {
    const diasAntiguedad = dias ? parseInt(dias, 10) : 30;
    return this.reglasService.limpiarBackupsViejos(diasAntiguedad);
  }

  /**
   * Reporte mensual para nómina
   * GET /reglas/reporte-mensual?mes=2026-09
   * GET /reglas/reporte-mensual?mes=2026-09&generarExcel=true
   */
  @Get('reporte-mensual')
  async reporteMensual(@Query('mes') mes?: string,@Query('generarExcel') generarExcel?: string){
    const conExcel = generarExcel === 'true';
    return await this.reglasService.generarReporteMensualNomina(mes, conExcel);
  }

    /**
   *  Limpiar cache de reportes (forzar recálculo)
   * GET /reglas/clear-report-cache
   */
  @Get('clear-report-cache')
  async clearReportCache() {
    return (this.reglasService as any).limpiarCachesReportes();
  }

}