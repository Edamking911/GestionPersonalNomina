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
import { MonedaService } from './moneda.service';

@Controller('moneda')
export class MonedaController {
  constructor(private readonly monedaService: MonedaService) {}

  @Get('/Traer-Todos')
  @HttpCode(HttpStatus.OK)
  async Traer_Todas() {
    const moneda = await this.monedaService.Traer_Monedas();
    return {
      message: 'Monedas Registradas*',
      control: moneda,
    };
  }

  @Get('/Obtener-Moneda/:codigo')
  @HttpCode(HttpStatus.OK)
  async Obtener_MonedaEspecifica(@Param('codigo') codigo: string) {
    const moneda = await this.monedaService.Obtener_Moneda(codigo);
    return {
      message: 'Se ha encontrado la Moneda*',
      control: moneda,
    };
  }

  @Post('/Agregar-Moneda')
  @HttpCode(HttpStatus.CREATED)
  async Crear_Moneda(@Body() Createmoneda) {
    const moneda = await this.monedaService.Crear_Moneda(Createmoneda);
    return {
      message: 'Se ha agregado la Moneda*',
      control: moneda,
    };
  }

  @Delete('/Eliminar-Moneda/:codigo')
  @HttpCode(HttpStatus.OK)
  async Eliminar_Moneda(@Param('codigo') codigo: string) {
    const moneda = await this.monedaService.Eliminar_Moneda(codigo);
    return {
      message: 'Se ha Eliminado Correctamente la moneda',
      control: moneda,
    };
  }

  @Patch('/Actualizar-Moneda/:codigo')
  @HttpCode(HttpStatus.OK)
  async Actualializar_Moneda(
    @Param('codigo') codigo: string,
    @Body() updatemoneda,
  ) {
    const moneda = await this.monedaService.Actualizar_Moneda(
      codigo,
      updatemoneda,
    );
    return {
      message: 'Se ha actualizado Correctamente la Moneda*',
      control: moneda,
    };
  }
}
