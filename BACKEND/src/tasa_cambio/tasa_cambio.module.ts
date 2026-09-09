import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasaCambioService } from './tasa_cambio.service';
import { TasaCambioController } from './tasa_cambio.controller';
import { TasaCambio } from '../Entitys/Tasa_Cambio/Tasas_Cambio.entity';
import { Moneda } from '../Entitys/Moneda/Moneda.entity';
@Module({
  imports: [TypeOrmModule.forFeature([TasaCambio, Moneda])],
  controllers: [TasaCambioController],
  providers: [TasaCambioService],
})
export class TasaCambioModule {}
