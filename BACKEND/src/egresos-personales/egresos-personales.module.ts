import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EgresosPersonalesService } from './egresos-personales.service';
import { EgresosPersonalesController } from './egresos-personales.controller';
import { EgresoPersonal } from '../Entitys/EgresosPersonales/EgresoPersonal.entity';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EgresoPersonal, Empleado])],
  controllers: [EgresosPersonalesController],
  providers: [EgresosPersonalesService],
  exports: [EgresosPersonalesService],
})
export class EgresosPersonalesModule {}
