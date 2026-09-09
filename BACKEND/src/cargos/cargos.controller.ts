import { Controller, Body, Get, Delete, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CargosService } from './cargos.service';

@Controller('cargos')
export class CargosController {
  constructor(private readonly cargosService: CargosService) {}

  @Get('/Traer-cargos')
  @HttpCode(HttpStatus.OK)
  async Traer_Cargos(){
    const cargo = await this.cargosService.Traer_Cargos()
    return{
      message : 'Cargos Creados *',
      control: cargo
    }
  }

  @Get('/Obtener-Cargos/:nombre')
  @HttpCode(HttpStatus.OK)
  async Obtener_CargoEspecifico(@Param('nombre') nombre: string){
    const cargo = await this.cargosService.Obtener_CargoEspecifico(nombre)
    return{
      message: 'Cargo Encontrado*',
      control: cargo
    }
  }

  @Post('/Crear-Cargo/:nombre')
  @HttpCode(HttpStatus.CREATED)
  async Crear_Cargo(@Param('nombre') nombre:string, @Body() CreateCargoDto){
    const cargo = await this.cargosService.Create_Cargo(nombre, CreateCargoDto)
    return {
      message: 'Se ha Creado El Cargo correctamente*',
      control: cargo
    }
  }

  @Delete('/Eliminar-Cargo/:nombre')
  @HttpCode(HttpStatus.OK)
  async Eliminar_Cargo(@Param('nombre') nombre: string){
    const cargo = await this.cargosService.Eliminar_cargo(nombre)
    return{
      message: 'Se ha eliminado el cargo Correctamente*',
      control: cargo
    }
  }

  @Patch('/Actualizar-Cargo/:nombre')
  @HttpCode(HttpStatus.OK)
  async Actualizar_Cargo(@Param('nombre') nombre: string, @Body() updateCargoDTO){
    const cargo = await this.cargosService.Actualizar_Cargo(nombre,updateCargoDTO)
    return{
      message: 'Se ha Actualizado el Cargo Correctamente',
      control: cargo
    }
  }
}
