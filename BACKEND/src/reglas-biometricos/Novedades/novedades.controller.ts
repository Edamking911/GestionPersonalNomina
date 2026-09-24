import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NovedadesService } from './novedades.service';
import { NovedadesReporteService } from './novedades-reporte.service';
import { NovedadesPdfService } from './novedades-pdf.service';
import { CreateNovedadDto } from '../../DTOS/Novedades/CreateNovedad.dto';
import { UpdateNovedadDto } from '../../DTOS/Novedades/UpdateNovedad.dto';

@Controller('reglas/novedades')
export class NovedadesController {
  constructor(
    private readonly novedadesService: NovedadesService,
    private readonly reporteService: NovedadesReporteService,
    private readonly pdfService: NovedadesPdfService,
  ) {}

  // =========================================================
  // ⚠️ IMPORTANTE: las rutas específicas van ANTES de ':id'
  // =========================================================

  // ============ REPORTES JSON (Opción C) ============

  @Get('reporte-empleado/:cedula')
  @HttpCode(HttpStatus.OK)
  async reporteEmpleado(
    @Param('cedula') cedula: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return await this.reporteService.reportePorEmpleado(cedula, desde, hasta);
  }

  @Get('resumen-mensual/:cedula')
  @HttpCode(HttpStatus.OK)
  async resumenMensual(
    @Param('cedula') cedula: string,
    @Query('mes') mes?: string,
  ) {
    return await this.reporteService.resumenMensual(cedula, mes);
  }

  @Get('estadisticas')
  @HttpCode(HttpStatus.OK)
  async estadisticas(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return await this.reporteService.estadisticasGlobales(desde, hasta);
  }

  // ============ PDFs (Opción A) ============

  @Get('reporte-empleado/:cedula/pdf')
  async reporteEmpleadoPDF(
    @Param('cedula') cedula: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return await this.pdfService.reporteEmpleadoPDF(cedula, desde, hasta);
  }

  @Get(':id/constancia.pdf')
  async constanciaPDF(@Param('id') id: string) {
    return await this.pdfService.constanciaPDF(id);
  }

  // ============ CRUD ============

  @Get()
  @HttpCode(HttpStatus.OK)
  async listar(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('cedula') cedula?: string,
    @Query('incluirInactivas') incluirInactivas?: string,
  ) {
    const data = await this.novedadesService.listar(
      desde,
      hasta,
      cedula,
      incluirInactivas === 'true',
    );
    return { success: true, total: data.length, novedades: data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async obtener(@Param('id') id: string) {
    const data = await this.novedadesService.obtenerPorId(id);
    return { success: true, novedad: data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CreateNovedadDto) {
    return await this.novedadesService.crear(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async actualizar(@Param('id') id: string, @Body() dto: UpdateNovedadDto) {
    return await this.novedadesService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id') id: string) {
    return await this.novedadesService.eliminar(id);
  }
}