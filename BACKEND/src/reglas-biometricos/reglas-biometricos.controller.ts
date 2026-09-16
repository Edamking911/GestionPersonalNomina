import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReglasBiometricosService } from './reglas-biometricos.service';
import 'multer';

@Controller('reglas')
export class ReglasBiometricosController {
  constructor(private readonly reglasService: ReglasBiometricosService) {}

  // =========================================================
  // REGLAS Y CONFIGURACIÓN
  // =========================================================

  @Get()
  getReglas() {
    return this.reglasService.getReglas();
  }

  @Get('dias-libres')
  getDiasLibres() {
    return this.reglasService.getDiasLibres();
  }

  // =========================================================
  // ASIGNACIONES
  // =========================================================

  @Get('asignaciones')
  async getAsignaciones(
    @Query('semana') semana?: string,
    @Query('generarExcel') generarExcel?: string,
  ) {
    const conExcel = generarExcel === 'true';
    return await this.reglasService.getAsignaciones(semana, conExcel);
  }

  @Post('asignar')
  async asignarHorario(
    @Body()
    body: { employeeId: string; horarioId: string; diasLibresFijos?: string[] },
  ) {
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

  // =========================================================
  // EVALUACIÓN
  // =========================================================

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

  // =========================================================
  // REPORTES
  // =========================================================

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

  @Get('reporte-mensual')
  async reporteMensual(
    @Query('mes') mes?: string,
    @Query('generarExcel') generarExcel?: string,
  ) {
    const conExcel = generarExcel === 'true';
    return await this.reglasService.generarReporteMensualNomina(mes, conExcel);
  }

  @Post('validar-salidas')
  async validarSalidas(
    @Body() body: { fecha?: string; generarExcel?: boolean },
  ) {
    const fechaStr = body.fecha || new Date().toISOString().slice(0, 10);
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    return await this.reglasService.validarSalidasPendientes(
      fecha,
      body.generarExcel,
    );
  }

  // =========================================================
  // PLANTILLA EXCEL
  // =========================================================

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

  @Post('importar-excel-asignaciones')
  @UseInterceptors(FileInterceptor('file'))
  async importarExcelAsignaciones(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }
    return await this.reglasService.importarExcelAsignaciones(file.buffer);
  }

  // =========================================================
  // BACKUPS
  // =========================================================

  @Get('backups')
  listarBackups() {
    return this.reglasService.listarBackups();
  }

  @Post('rollback')
  restaurarBackup(@Body() body: { nombre: string }) {
    if (!body?.nombre) {
      throw new BadRequestException('Debes enviar el nombre del backup');
    }
    return this.reglasService.restaurarBackup(body.nombre);
  }

  @Post('rollback-ultimo')
  restaurarUltimoBackup() {
    return this.reglasService.restaurarUltimoBackup();
  }

  @Get('limpiar-backups')
  limpiarBackups(@Query('dias') dias?: string) {
    const diasAntiguedad = dias ? parseInt(dias, 10) : 30;
    return this.reglasService.limpiarBackupsViejos(diasAntiguedad);
  }

  // =========================================================
  // CACHE
  // =========================================================

  @Get('clear-report-cache')
  async clearReportCache() {
    return this.reglasService.limpiarCachesReportes();
  }
}