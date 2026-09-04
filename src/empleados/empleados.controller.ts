import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmpleadosService } from './empleados.service';
import { CreateEmpleadoDto } from '../DTOS/Empleados/Create-Empleado.dto';
import { UpdateEmpleadoDto } from '../DTOS/Empleados/Update-Empleado.dto';
import { CreateHistoricoSalarioDto } from '../DTOS/HistoricosSalarios/Create-HistoricoSalario.dto';

@ApiTags('Empleados')
@Controller('empleados')
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo empleado',
    description: 'Registra un nuevo empleado en el sistema',
  })
  @ApiBody({ type: CreateEmpleadoDto })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Cédula ya registrada' })
  @ApiResponse({
    status: 404,
    description: 'Cargo o departamento no encontrado',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async create(@Body() createDto: CreateEmpleadoDto) {
    const empleado = await this.empleadosService.create(createDto);
    return {
      message: 'Empleado creado exitosamente',
      empleado,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los empleados',
    description:
      'Retorna la lista de empleados con filtros opcionales y relaciones',
  })
  @ApiQuery({
    name: 'nombre',
    required: false,
    description: 'Filtrar por nombre o apellido',
    example: 'Juan',
  })
  @ApiQuery({
    name: 'cedula',
    required: false,
    description: 'Filtrar por cédula',
    example: 'V-12345678',
  })
  @ApiQuery({
    name: 'cargoId',
    required: false,
    description: 'Filtrar por ID de cargo (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiQuery({
    name: 'departamentoId',
    required: false,
    description: 'Filtrar por ID de departamento (UUID)',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado',
    enum: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empleados obtenida exitosamente',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findAll(
    @Query('nombre') nombre?: string,
    @Query('cedula') cedula?: string,
    @Query('cargoId') cargoId?: string,
    @Query('departamentoId') departamentoId?: string,
    @Query('estado') estado?: string,
  ) {
    const empleados = await this.empleadosService.findAll({
      nombre,
      cedula,
      cargoId,
      departamentoId,
      estado,
    });
    return {
      message: 'Lista de empleados',
      empleados,
    };
  }

  @Get('cedula/:cedula')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener empleado por cédula',
    description:
      'Retorna un empleado específico con todas sus relaciones por cédula',
  })
  @ApiParam({
    name: 'cedula',
    description: 'Cédula del empleado',
    example: 'V-12345678',
  })
  @ApiResponse({ status: 200, description: 'Empleado encontrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findByCedula(@Param('cedula') cedula: string) {
    const empleado = await this.empleadosService.findByCedula(cedula);
    return {
      message: 'Empleado encontrado',
      empleado,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener empleado por ID',
    description:
      'Retorna un empleado específico con todas sus relaciones por ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del empleado (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Empleado encontrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findOne(@Param('id') id: string) {
    const empleado = await this.empleadosService.findOne(id);
    return {
      message: 'Empleado encontrado',
      empleado,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un empleado',
    description: 'Actualiza los datos de un empleado existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del empleado (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({ type: UpdateEmpleadoDto })
  @ApiResponse({
    status: 200,
    description: 'Empleado actualizado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 404,
    description: 'Empleado, cargo o departamento no encontrado',
  })
  @ApiResponse({ status: 409, description: 'Cédula ya registrada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateEmpleadoDto) {
    const empleado = await this.empleadosService.update(id, updateDto);
    return {
      message: 'Empleado actualizado exitosamente',
      empleado,
    };
  }

  @Patch(':id/toggle-estado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alternar estado del empleado',
    description:
      'Cambia el estado del empleado (ACTIVO ↔ INACTIVO, SUSPENDIDO → ACTIVO)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del empleado (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async toggleEstado(@Param('id') id: string) {
    const empleado = await this.empleadosService.toggleEstado(id);
    return {
      message: 'Estado del empleado actualizado',
      empleado,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar un empleado (soft delete)',
    description: 'Realiza soft delete del empleado (cambia estado a INACTIVO)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del empleado (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Empleado eliminado exitosamente (soft delete)',
  })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async remove(@Param('id') id: string) {
    const empleado = await this.empleadosService.softDelete(id);
    return {
      message: 'Empleado eliminado exitosamente (soft delete)',
      empleado,
    };
  }

  @Post(':id/historico-salario')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar histórico de salario',
    description: 'Registra un nuevo histórico de salario para el empleado',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del empleado (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({ type: CreateHistoricoSalarioDto })
  @ApiResponse({
    status: 201,
    description: 'Histórico de salario creado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async addHistoricoSalario(
    @Param('id') id: string,
    @Body() createDto: CreateHistoricoSalarioDto,
  ) {
    const historico = await this.empleadosService.addHistoricoSalario({
      ...createDto,
      empleadoId: id,
    });
    return {
      message: 'Histórico de salario creado exitosamente',
      historico,
    };
  }

  @Get(':id/historico-salario')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener histórico de salarios',
    description: 'Retorna el histórico de salarios del empleado',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del empleado (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de salarios obtenido exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getHistoricoSalarios(@Param('id') id: string) {
    const historicos = await this.empleadosService.getHistoricoSalarios(id);
    return {
      message: 'Histórico de salarios del empleado',
      historicos,
    };
  }
}
