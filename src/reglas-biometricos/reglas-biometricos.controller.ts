import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ReglasBiometricosService } from './reglas-biometricos.service';

@Controller('reglas')
export class ReglasBiometricosController {
  constructor(private readonly reglasService: ReglasBiometricosService) {}

  @Get()
  getReglas() {
    return this.reglasService.getReglas();
  }

  /**
   * Obtener asignaciones de turnos.
   * Query opcional: `semana` en formato YYYY-MM-DD (domingo de esa semana).
   * Si no se envía, se usa la semana actual.
   */
  @Get('asignaciones')
  getAsignaciones(@Query('semana') semana?: string) {
    return this.reglasService.getAsignaciones(semana);
  }

  @Get('dias-libres')
  getDiasLibres() {
    return this.reglasService.getDiasLibres();
  }

  @Post('asignar')
  asignarHorario(
    @Body() body: { employeeId: string; horarioId: string; diasLibresFijos?: string[] },
  ) {
    return this.reglasService.asignarHorario(
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
  async validarSalidas(@Body() body: { fecha?: string }) {
    const fechaStr = body.fecha || new Date().toISOString().slice(0, 10);
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    return await this.reglasService.validarSalidasPendientes(fecha);
  }

  @Get('evaluar/:employeeId/:fecha')
  async evaluarEmpleado(
    @Param('employeeId') employeeId: string,
    @Param('fecha') fecha: string,
  ) {
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaLocal = new Date(year, month - 1, day);
    return await this.reglasService.evaluarEmpleado(employeeId, fechaLocal);
  }

  @Get('reporte/:fecha')
  async reporteDiario(@Param('fecha') fecha: string) {
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaLocal = new Date(year, month - 1, day);
    return await this.reglasService.generarReporteDiario(fechaLocal);
  }
}