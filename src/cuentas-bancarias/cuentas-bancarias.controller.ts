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
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CreateCuentaBancariaDto } from '../DTOS/CuentasBancarias/Create-CuentaBancaria.dto';
import { UpdateCuentaBancariaDto } from '../DTOS/CuentasBancarias/Update-CuentaBancaria.dto';

@ApiTags('Cuentas Bancarias')
@Controller('cuentas-bancarias')
export class CuentasBancariasController {
  constructor(private readonly cuentasService: CuentasBancariasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva cuenta bancaria',
    description:
      'Crea una cuenta bancaria para un empleado con encriptación del número de cuenta',
  })
  @ApiBody({ type: CreateCuentaBancariaDto })
  @ApiResponse({
    status: 201,
    description: 'Cuenta bancaria creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o empleado ya tiene cuenta principal',
  })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async create(@Body() createDto: CreateCuentaBancariaDto) {
    const cuenta = await this.cuentasService.create(createDto);
    return {
      message: 'Cuenta bancaria creada exitosamente',
      cuenta,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todas las cuentas bancarias',
    description:
      'Retorna la lista completa de cuentas bancarias con información del empleado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cuentas bancarias obtenida exitosamente',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findAll() {
    const cuentas = await this.cuentasService.findAll();
    return {
      message: 'Lista de cuentas bancarias',
      cuentas,
    };
  }

  @Get('empleado/:empleadoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener cuentas bancarias de un empleado',
    description:
      'Retorna todas las cuentas bancarias asociadas a un empleado específico',
  })
  @ApiParam({
    name: 'empleadoId',
    description: 'ID del empleado (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Cuentas del empleado obtenidas exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findByEmpleado(@Param('empleadoId') empleadoId: string) {
    const cuentas = await this.cuentasService.findByEmpleado(empleadoId);
    return {
      message: `Cuentas bancarias del empleado ${empleadoId}`,
      cuentas,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener una cuenta bancaria por ID',
    description:
      'Retorna una cuenta bancaria específica con información del empleado',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la cuenta bancaria (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Cuenta bancaria encontrada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findOne(@Param('id') id: string) {
    const cuenta = await this.cuentasService.findOne(id);
    return {
      message: 'Cuenta bancaria encontrada',
      cuenta,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar una cuenta bancaria',
    description: 'Actualiza los datos de una cuenta bancaria existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la cuenta bancaria (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({ type: UpdateCuentaBancariaDto })
  @ApiResponse({
    status: 200,
    description: 'Cuenta bancaria actualizada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o empleado ya tiene cuenta principal',
  })
  @ApiResponse({
    status: 404,
    description: 'Cuenta bancaria o empleado no encontrado',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCuentaBancariaDto,
  ) {
    const cuenta = await this.cuentasService.update(id, updateDto);
    return {
      message: 'Cuenta bancaria actualizada exitosamente',
      cuenta,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar una cuenta bancaria',
    description: 'Elimina una cuenta bancaria por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la cuenta bancaria (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Cuenta bancaria eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async remove(@Param('id') id: string) {
    const cuenta = await this.cuentasService.remove(id);
    return {
      message: 'Cuenta bancaria eliminada exitosamente',
      cuenta,
    };
  }
}
