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
import { CargosService } from './cargos.service';
import { CreateCargoDto } from '../DTOS/Cargos/Create-Cargos.dto';
import { UpdateCargoDto } from '../DTOS/Cargos/Update-Cargos.dto';

@ApiTags('Cargos')
@Controller('cargos')
export class CargosController {
  constructor(private readonly cargosService: CargosService) {}

  @Get('/Traer-cargos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los cargos',
    description: 'Retorna la lista completa de cargos registrados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cargos obtenida exitosamente',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async Traer_Cargos() {
    const cargo = await this.cargosService.Traer_Cargos();
    return {
      message: 'Cargos Creados *',
      control: cargo,
    };
  }

  @Get('/Obtener-Cargos/:nombre')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un cargo por nombre',
    description: 'Busca y retorna un cargo específico por su nombre',
  })
  @ApiParam({
    name: 'nombre',
    description: 'Nombre del cargo a buscar',
    example: 'Desarrollador Senior',
  })
  @ApiResponse({ status: 200, description: 'Cargo encontrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async Obtener_CargoEspecifico(@Param('nombre') nombre: string) {
    const cargo = await this.cargosService.Obtener_CargoEspecifico(nombre);
    return {
      message: 'Cargo Encontrado*',
      control: cargo,
    };
  }

  @Post('/Crear-Cargo/:nombre')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo cargo',
    description: 'Crea un nuevo cargo asociado a un departamento existente',
  })
  @ApiParam({
    name: 'nombre',
    description: 'Nombre del departamento al que pertenece el cargo',
    example: 'Recursos Humanos',
  })
  @ApiBody({ type: CreateCargoDto })
  @ApiResponse({ status: 201, description: 'Cargo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
  @ApiResponse({ status: 409, description: 'El cargo ya existe' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async Crear_Cargo(
    @Param('nombre') nombre: string,
    @Body() createCargoDto: CreateCargoDto,
  ) {
    const cargo = await this.cargosService.Create_Cargo(nombre, createCargoDto);
    return {
      message: 'Se ha Creado El Cargo correctamente*',
      control: cargo,
    };
  }

  @Delete('/Eliminar-Cargo/:nombre')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar un cargo',
    description: 'Elimina un cargo por su nombre',
  })
  @ApiParam({
    name: 'nombre',
    description: 'Nombre del cargo a eliminar',
    example: 'Desarrollador Senior',
  })
  @ApiResponse({ status: 200, description: 'Cargo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async Eliminar_Cargo(@Param('nombre') nombre: string) {
    const cargo = await this.cargosService.Eliminar_cargo(nombre);
    return {
      message: 'Se ha eliminado el cargo Correctamente*',
      control: cargo,
    };
  }

  @Patch('/Actualizar-Cargo/:nombre')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un cargo',
    description: 'Actualiza los datos de un cargo existente',
  })
  @ApiParam({
    name: 'nombre',
    description: 'Nombre del cargo a actualizar',
    example: 'Desarrollador Senior',
  })
  @ApiBody({ type: UpdateCargoDto })
  @ApiResponse({ status: 200, description: 'Cargo actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async Actualizar_Cargo(
    @Param('nombre') nombre: string,
    @Body() updateCargoDTO: UpdateCargoDto,
  ) {
    const cargo = await this.cargosService.Actualizar_Cargo(
      nombre,
      updateCargoDTO,
    );
    return {
      message: 'Se ha Actualizado el Cargo Correctamente',
      control: cargo,
    };
  }
}
