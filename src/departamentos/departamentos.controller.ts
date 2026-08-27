import { Controller, Body, Get, Delete, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { DepartamentosService } from './departamentos.service';

@Controller('departamentos')
export class DepartamentosController {
  constructor(private readonly departamentosService: DepartamentosService) {}

  @Get('/Traer-Todos')
  @HttpCode(HttpStatus.OK)
  async Traer_Departamentos(){
    const departamento = await this.departamentosService.Traer_Departamentos()
    return {
      message : 'Lista de los Departamentos *',
      control : departamento
    }
  }

  @Get('/Obtener-Departamento/:nombre')
  @HttpCode(HttpStatus.OK)
  async Obtener_Departamento(@Param('nombre') nombre : string){
    const departamento = await this.departamentosService.Buscar_Departamento(nombre);
    return{
      message : 'Departamento Encontrado Exitosamente *',
      control : departamento
    }
  }

  @Post('/Agregar-Departamento')
  @HttpCode(HttpStatus.CREATED)
  async Agregar_Departamento(@Body() CreateDepartamento){
    const departamento = await this.departamentosService.Crear_Departamento(CreateDepartamento);
    return{
      message : 'Se ha Creado Exitosamente El Departamento *',
      control : departamento
    }
  }

  @Delete('/Eliminar-Departamento/:nombre')
  @HttpCode(HttpStatus.OK)
  async Eliminar_Departamento(@Param('nombre') nombre : string){
    const departamento = await this.departamentosService.Eliminar_Departamento(nombre)
    return{
      message : 'Se ha Eliminado exitosamente el Departamento *',
      control : departamento
    }
  }

  @Patch('/Actualizar-Departamento/:nombre')
  @HttpCode(HttpStatus.OK)
  async  Actualizar_Departamento(@Param('nombre') nombre: string ,@Body() UpdateDepartamento){
    const departamento = await this.departamentosService.Actualizar_Departamento(nombre, UpdateDepartamento)
    return{
      message : 'Se ha Actualizado Exitosamente El Departamento *',
      control : departamento
    }
  }

}
