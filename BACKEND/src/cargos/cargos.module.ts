import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargosService } from './cargos.service';
import { CargosController } from './cargos.controller';
import { Departamento } from '../Entitys/Departamentos/Departamentos.entity';
import { Cargo } from '../Entitys/Cargos/Cargos.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Departamento, Cargo])],
  controllers: [CargosController],
  providers: [CargosService],
})
export class CargosModule {}
