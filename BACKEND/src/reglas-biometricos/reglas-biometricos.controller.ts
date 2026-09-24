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
  // CACHE
  // =========================================================

  @Get('clear-report-cache')
  async clearReportCache() {
    return this.reglasService.limpiarCachesReportes();
  }

// =========================================================
// SINCRONIZACIÓN DE EMPLEADOS
// =========================================================

/**
 * POST /reglas/sync-empleados
 * Lee los empleados del biométrico y los sincroniza con la BD.
 * - Ignora cédulas inválidas
 * - Ignora el admin del equipo
 * - No duplica
 * - Actualiza nombres si cambiaron
 */
  @Post('sync-empleados') //Uso solo por Desarrolladores o este caso Los administradores del sistema   curl -k -X POST https://localhost:3001/reglas/sync-empleados
  async sincronizarEmpleados() {
    return await this.reglasService.sincronizarEmpleadosDesdeBiometrico();
  }


 // Usos Solo por los Desarrolladores
  // =========================================================
// MIGRACIÓN JSON → BD
// =========================================================

/**
 * POST /reglas/migrar-asignaciones
 * Lee asignaciones_turnos.json y las migra a la tabla asignaciones_horarios.
 * ⚠️ Solo usar UNA VEZ. No duplica las que ya existen.
 */
  @Post('migrar-asignaciones')
  async migrarAsignaciones() {
    return await this.reglasService.migrarAsignaciones();
  }

  /**
   * POST /reglas/migrar-dias-libres
   * Lee dias_libres.json y los migra a la tabla dias_libres.
   * ⚠️ Solo usar UNA VEZ. Borra los días previos de cada empleado.
   */
  @Post('migrar-dias-libres')
  async migrarDiasLibres() {
    return await this.reglasService.migrarDiasLibres();
  }

  /**
   * POST /reglas/migrar-todo
   * Migra asignaciones + días libres de una sola vez.
   * ⚠️ Solo usar UNA VEZ.
   */
  @Post('migrar-todo')
  async migrarTodo() {
    return await this.reglasService.migrarTodo();
  }

  /**
   * GET /reglas/estado-migracion
   * Verifica qué está migrado y qué falta.
   */
  @Get('estado-migracion')
  async estadoMigracion() {
    return await this.reglasService.estadoMigracion();
  }

}