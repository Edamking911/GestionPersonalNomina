import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { EgresosPersonalesService } from './egresos-personales.service';
import { CreateEgresoPersonalDto } from '../DTOS/EgresosPersonales/Create-EgresoPersonal.dto';
import { UpdateEgresoPersonalDto } from '../DTOS/EgresosPersonales/Update-EgresoPersonal.dto';

@ApiTags('Egresos Personales')
@Controller('egresos-personales')
export class EgresosPersonalesController {
  constructor(private readonly egresosService: EgresosPersonalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo egreso personal',
    description: 'Registra un egreso personal para un empleado',
  })
  @ApiBody({ type: CreateEgresoPersonalDto })
  @ApiResponse({
    status: 201,
    description: 'Egreso personal creado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o fecha futura' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async create(@Body() createDto: CreateEgresoPersonalDto) {
    const egreso = await this.egresosService.create(createDto);
    return {
      message: 'Egreso personal creado exitosamente',
      egreso,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los egresos personales',
    description:
      'Retorna la lista completa de egresos personales con información del empleado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de egresos personales obtenida exitosamente',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findAll() {
    const egresos = await this.egresosService.findAll();
    return {
      message: 'Lista de egresos personales',
      egresos,
    };
  }

  @Get('empleado/:empleadoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener egresos personales de un empleado',
    description: 'Retorna el historial de egresos de un empleado específico',
  })
  @ApiParam({
    name: 'empleadoId',
    description: 'ID del empleado (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Egresos del empleado obtenidos exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findByEmpleado(@Param('empleadoId') empleadoId: string) {
    const egresos = await this.egresosService.findByEmpleado(empleadoId);
    return {
      message: `Egresos personales del empleado ${empleadoId}`,
      egresos,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un egreso personal por ID',
    description:
      'Retorna un egreso personal específico con información del empleado',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del egreso personal (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Egreso personal encontrado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Egreso personal no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findOne(@Param('id') id: string) {
    const egreso = await this.egresosService.findOne(id);
    return {
      message: 'Egreso personal encontrado',
      egreso,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un egreso personal',
    description: 'Actualiza los datos de un egreso personal existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del egreso personal (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({ type: UpdateEgresoPersonalDto })
  @ApiResponse({
    status: 200,
    description: 'Egreso personal actualizado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o fecha futura' })
  @ApiResponse({
    status: 404,
    description: 'Egreso personal o empleado no encontrado',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEgresoPersonalDto,
  ) {
    const egreso = await this.egresosService.update(id, updateDto);
    return {
      message: 'Egreso personal actualizado exitosamente',
      egreso,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar un egreso personal',
    description: 'Elimina un egreso personal por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del egreso personal (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Egreso personal eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Egreso personal no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async remove(@Param('id') id: string) {
    const egreso = await this.egresosService.remove(id);
    return {
      message: 'Egreso personal eliminado exitosamente',
      egreso,
    };
  }
}