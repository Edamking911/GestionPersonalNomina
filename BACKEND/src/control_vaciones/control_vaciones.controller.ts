import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ControlVacionesService } from './control_vaciones.service';
import { VacacionesGeneradorService } from './vacaciones-generador.service';
import { SolicitarVacacionesDto } from '../DTOS/Control_Vacaciones/SolicitarVacaciones.dto';

@Controller('control-vacaciones')
export class ControlVacionesController {
  constructor(
    private readonly controlVacionesService: ControlVacionesService,
    private readonly generadorService: VacacionesGeneradorService,
  ){}

  @Post('solicitar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar vacaciones para un empleado',
    description:
      'Procesa la solicitud: valida saldo, calcula días hábiles (salta fines de semana y feriados), registra en novedades_nomina y actualiza el saldo.',
  })
  @ApiBody({ type: SolicitarVacacionesDto })
  @ApiResponse({ status: 201, description: 'Vacaciones procesadas' })
  @ApiResponse({ status: 400, description: 'Sin saldo o empleado inactivo' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 409, description: 'Solapamiento con otra novedad' })
  async solicitar(@Body() dto: SolicitarVacacionesDto) {
    return await this.controlVacionesService.solicitarVacaciones(dto);
  }

  @Get('saldo/:cedula')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ver saldo de vacaciones de un empleado' })
  @ApiParam({ name: 'cedula', example: '22652518' })
  async saldo(@Param('cedula') cedula: string) {
    return await this.controlVacionesService.saldoEmpleado(cedula);
  }

  @Get('vencidas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Empleados con vacaciones vencidas (saldo pendiente)' })
  async vencidas() {
    const data = await this.controlVacionesService.vacacionesVencidas();
    return { success: true, total: data.length, empleados: data };
  }

  @Get('proximos-aniversarios')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Empleados que cumplen año en los próximos 30 días' })
  async proximos() {
    const data = await this.controlVacionesService.proximosAniversarios();
    return { success: true, total: data.length, empleados: data };
  }

  @Get('actuales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Empleados que están de vacaciones hoy' })
  async actuales() {
    const data = await this.controlVacionesService.actualmenteDeVacaciones();
    return { success: true, total: data.length, empleados: data };
  }

  @Post('generar-anual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forzar generación de vacaciones del año (uso admin)',
    description: 'Útil para testing o para correr la generación manualmente.',
  })
  async generarAnual() {
    return await this.generadorService.generarVacacionesAnuales();
  }
}
