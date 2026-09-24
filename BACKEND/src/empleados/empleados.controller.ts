import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmpleadosService } from './empleados.service';
import { EmpleadosExcelService } from './empleados-excel.service';
import { CreateEmpleadoDto } from '../DTOS/Empleados/Create-Empleado.dto';
import { UpdateEmpleadoDto } from '../DTOS/Empleados/Update-Empleado.dto';

@ApiTags('Empleados')
@Controller('empleados')
export class EmpleadosController {
  constructor(
    private readonly empleadosService: EmpleadosService,
    private readonly empleadosExcelService: EmpleadosExcelService,
  ) {}

  // =========================================================
  // 📄 EXCEL — Carga masiva
  // =========================================================

  @Get('plantilla')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Descargar plantilla Excel de empleados',
    description:
      'Genera un archivo Excel con los campos necesarios, la hoja de cargos válidos y las instrucciones.',
  })
  @ApiResponse({ status: 200, description: 'Plantilla descargada' })
  async plantillaEmpleados() {
    return await this.empleadosExcelService.generarPlantillaEmpleados();
  }

  @Post('validar-excel')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Validar Excel de empleados (sin importar)',
    description:
      'Analiza el Excel y devuelve un preview con los errores y las filas válidas SIN crear los empleados.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Validación completada' })
  @ApiResponse({ status: 400, description: 'No se subió archivo' })
  async validarExcelEmpleados(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }
    return await this.empleadosExcelService.validarExcelEmpleados(file.buffer);
  }

  @Post('importar-excel')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Importar Excel de empleados',
    description:
      'Valida y luego crea TODOS los empleados del Excel. Si hay errores, no crea ninguno.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Empleados importados' })
  @ApiResponse({ status: 400, description: 'No se subió archivo o hay errores' })
  async importarExcelEmpleados(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }
    return await this.empleadosExcelService.importarExcelEmpleados(file.buffer);
  }

  // =========================================================
  // 📋 CRUD — Empleados
  // =========================================================

  @Post('crear-empleado/:nombre')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo empleado',
    description:
      'Registra un nuevo empleado asociándolo al cargo indicado en la URL (por nombre).',
  })
  @ApiParam({
    name: 'nombre',
    description: 'Nombre del cargo (debe existir en BD)',
    example: 'Gerencia',
  })
  @ApiBody({ type: CreateEmpleadoDto })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Cédula ya registrada' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async create(
    @Param('nombre') nombre: string,
    @Body() createDto: CreateEmpleadoDto,
  ) {
    const empleado = await this.empleadosService.Crear_Empleado(
      nombre,
      createDto,
    );
    return {
      message: 'Empleado creado exitosamente',
      empleado,
    };
  }

  @Get('Obtener-Empleados')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los empleados',
    description:
      'Retorna el listado completo de empleados con el NOMBRE del cargo (no UUID).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empleados obtenida exitosamente',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findAll() {
    const empleados = await this.empleadosService.Obtener_Empleados_Todos();
    return {
      message: 'Lista de empleados',
      total: empleados.length,
      empleados,
    };
  }

  @Get('Obtener-Empleado/:cedula')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener empleado por cédula',
    description: 'Retorna un empleado específico con su cargo anidado.',
  })
  @ApiParam({
    name: 'cedula',
    description: 'Cédula del empleado (solo números)',
    example: '22652518',
  })
  @ApiResponse({ status: 200, description: 'Empleado encontrado' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findOne(@Param('cedula') cedula: string) {
    const empleado = await this.empleadosService.Obtener_Empleado_ID(cedula);
    return {
      message: 'Empleado encontrado',
      empleado,
    };
  }

  @Patch('Actualizar-Empleado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un empleado',
    description:
      'Actualiza los datos de un empleado. La cédula es obligatoria en el body para identificar al empleado.',
  })
  @ApiBody({ type: UpdateEmpleadoDto })
  @ApiResponse({ status: 200, description: 'Empleado actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o cédula faltante' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async update(@Body() updateDto: UpdateEmpleadoDto) {
    const empleado = await this.empleadosService.Actualizar_Empleado(updateDto);
    return {
      message: 'Empleado actualizado exitosamente',
      empleado,
    };
  }

  @Patch('Desactivar-Empleado/:cedula')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desactivar empleado',
    description: 'Cambia el estado del empleado a INACTIVO.',
  })
  @ApiParam({
    name: 'cedula',
    description: 'Cédula del empleado',
    example: '22652518',
  })
  @ApiResponse({ status: 200, description: 'Empleado desactivado' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async desactivar(@Param('cedula') cedula: string) {
    const empleado = await this.empleadosService.Desactivar_empleado(cedula);
    return {
      message: 'Empleado desactivado exitosamente',
      empleado,
    };
  }

  @Delete('Eliminar-Empleado/:cedula')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar empleado (soft delete + inactivar)',
    description:
      'Marca el empleado como INACTIVO y aplica soft delete (deleted_at). No se puede eliminar dos veces.',
  })
  @ApiParam({
    name: 'cedula',
    description: 'Cédula del empleado',
    example: '22652518',
  })
  @ApiResponse({ status: 200, description: 'Empleado eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 409, description: 'Empleado ya eliminado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async remove(@Param('cedula') cedula: string) {
    const empleado = await this.empleadosService.Eliminar_empleado(cedula);
    return {
      message: 'Empleado eliminado exitosamente (soft delete)',
      empleado,
    };
  }
}