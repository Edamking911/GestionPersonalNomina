import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpleadosService } from './empleados.service';
import { EmpleadosController } from './empleados.controller';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';
import { Cargo } from '../Entitys/Cargos/Cargos.entity';
import { CuentaBancaria } from '../Entitys/CuentasBancarias/CuentaBancaria.entity';
import { EgresoPersonal } from '../Entitys/EgresosPersonales/EgresoPersonal.entity';
import { EmpleadosExcelService } from './empleados-excel.service';
import { EgresosPersonalesModule } from 'src/egresos-personales/egresos-personales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Empleado,
      Cargo,
      CuentaBancaria,
      EgresoPersonal,
    ]),
    EgresosPersonalesModule,
  ],
  controllers: [EmpleadosController],
  providers: [EmpleadosService,EmpleadosExcelService],
  exports: [EmpleadosService,EmpleadosExcelService],
})
export class EmpleadosModule {}
