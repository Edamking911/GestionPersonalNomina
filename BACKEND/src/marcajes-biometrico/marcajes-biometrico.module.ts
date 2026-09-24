import { Module } from '@nestjs/common';
import { MarcajesBiometricoService } from './marcajes-biometrico.service';
import { MarcajesBiometricoController } from './marcajes-biometrico.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarcajeBiometrico } from '../Entitys/MarcajeBiometrico/MarcajeBiometrico.entity';
@Module({
  imports:[TypeOrmModule.forFeature([MarcajeBiometrico])],
  controllers: [MarcajesBiometricoController],
  providers: [MarcajesBiometricoService],
})
export class MarcajesBiometricoModule {}
