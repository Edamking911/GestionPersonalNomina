import { Controller, Body, Get, Delete, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { TasaCambioService } from './tasa_cambio.service';

@Controller('tasa-cambio')
export class TasaCambioController {
  constructor(private readonly tasaCambioService: TasaCambioService) {}

  @Get('/Traer-Tasa')
  @HttpCode(HttpStatus.OK)
  async Traer_Tasas(){
    const tasa = await this.tasaCambioService.Traer_Tasas()
    return{
      message: 'Lista se ha Traido Todas las Tasas*',
      control: tasa
    }
  }

  @Get('/Obtener-Tasa/:tasa')
  @HttpCode(HttpStatus.OK)
  async Obtener_Tasa(@Param('tasa') tasa:number){
    const Tasa = await this.tasaCambioService.Obtener_Tasa(tasa)
    return {
      message: 'Se ha Encontrado la tasa*',
      control: Tasa
    }
  }

  @Post('/Crear-Tasa/:codigo')
  @HttpCode(HttpStatus.CREATED)
  async Crear_Tasa(@Param('codigo') codigo: string, @Body() createdtoTasa){
    const Tasa = await this.tasaCambioService.Crear_Tasa(codigo,createdtoTasa)
    return{
      message: 'Se ha creado Exitosamente la Tasa*',
      control: Tasa
    }
  }

  @Delete('/Eliminar-Tasa/:tasa')
  @HttpCode(HttpStatus.OK)
  async Eliminar_Registo(@Param('tasa') tasa: number){
    const Tasa = await this.tasaCambioService.Eliminar_Registro(tasa)
    return {
      message: 'Se ha Eliminado correctamente el registro*',
      control: Tasa
    }
  }

  @Patch('/Actualizar-Tasa/:tasa')
  @HttpCode(HttpStatus.OK)
  async Actualizar_Tasa(@Param('tasa') tasa: number,@Body() updatedtoTasa){
    const Tasa = await this.tasaCambioService.Actualizar_Tasa(tasa,updatedtoTasa)
    return{
      message: 'Se ha actualizado Correctamente El registro*',
      control: Tasa
    }
  }
}
