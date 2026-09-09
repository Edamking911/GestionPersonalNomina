import {
  Controller,
  Body,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { DepartamentosService } from './departamentos.service';
import { CreateDepartamentoDto } from '../DTOS/Departamentos/Create-Departamento.dto';
import { UpdateDepartamentoDto } from '../DTOS/Departamentos/Update-Departamento.dto';

@ApiTags('Departamentos')
@Controller('departamentos')
export class DepartamentosController {
  constructor(private readonly departamentosService: DepartamentosService) {}

  @Get('/Traer-Todos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los departamentos',
    description: 'Retorna la lista completa de departamentos registrados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de departamentos obtenida exitosamente',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async Traer_Departamentos() {
    const departamento = await this.departamentosService.Traer_Departamentos();
    return {
      message: 'Lista de los Departamentos *',
      control: departamento,
    };
  }

  @Get('/Obtener-Departamento/:nombre')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un departamento por nombre',
    description: 'Busca y retorna un departamento específico por su nombre',
  })
  @ApiParam({
    name: 'nombre',
    description: 'Nombre del departamento a buscar',
    example: 'Recursos Humanos',
  })
  @ApiResponse({
    status: 200,
    description: 'Departamento encontrado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async Obtener_Departamento(@Param('nombre') nombre: string) {
    const departamento =
      await this.departamentosService.Buscar_Departamento(nombre);
    return {
      message: 'Departamento Encontrado Exitosamente *',
      control: departamento,
    };
  }

  @Post('/Agregar-Departamento')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo departamento',
    description: 'Crea un nuevo departamento con nombre y código único',
  })
  @ApiBody({ type: CreateDepartamentoDto })
  @ApiResponse({ status: 201, description: 'Departamento creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'El departamento ya existe' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async Agregar_Departamento(
    @Body() createDepartamento: CreateDepartamentoDto,
  ) {
    const departamento =
      await this.departamentosService.Crear_Departamento(createDepartamento);
    return {
      message: 'Se ha Creado Exitosamente El Departamento *',
      control: departamento,
    };
  }

  @Delete('/Eliminar-Departamento/:nombre')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar un departamento',
    description: 'Elimina un departamento por su nombre',
  })
  @ApiParam({
    name: 'nombre',
    description: 'Nombre del departamento a eliminar',
    example: 'Recursos Humanos',
  })
  @ApiResponse({
    status: 200,
    description: 'Departamento eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async Eliminar_Departamento(@Param('nombre') nombre: string) {
    const departamento =
      await this.departamentosService.Eliminar_Departamento(nombre);
    return {
      message: 'Se ha Eliminado exitosamente el Departamento *',
      control: departamento,
    };
  }

  @Patch('/Actualizar-Departamento/:nombre')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un departamento',
    description: 'Actualiza los datos de un departamento existente',
  })
  @ApiParam({
    name: 'nombre',
    description: 'Nombre del departamento a actualizar',
    example: 'Recursos Humanos',
  })
  @ApiBody({ type: UpdateDepartamentoDto })
  @ApiResponse({
    status: 200,
    description: 'Departamento actualizado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async Actualizar_Departamento(
    @Param('nombre') nombre: string,
    @Body() updateDepartamento: UpdateDepartamentoDto,
  ) {
    const departamento =
      await this.departamentosService.Actualizar_Departamento(
        nombre,
        updateDepartamento,
      );
    return {
      message: 'Se ha Actualizado Exitosamente El Departamento *',
      control: departamento,
    };
  }
}
