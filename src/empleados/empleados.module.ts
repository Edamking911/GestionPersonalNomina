import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpleadosService } from './empleados.service';
import { EmpleadosController } from './empleados.controller';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';
import { Cargo } from '../Entitys/Cargos/Cargos.entity';
import { Departamento } from '../Entitys/Departamentos/Departamentos.entity';
import { CuentaBancaria } from '../Entitys/CuentasBancarias/CuentaBancaria.entity';
import { EgresoPersonal } from '../Entitys/EgresosPersonales/EgresoPersonal.entity';
import { HistoricoSalario } from '../Entitys/HistoricosSalarios/HistoricoSalario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Empleado,
      Cargo,
      Departamento,
      CuentaBancaria,
      EgresoPersonal,
      HistoricoSalario,
    ]),
  ],
  controllers: [EmpleadosController],
  providers: [EmpleadosService],
  exports: [EmpleadosService],
})
export class EmpleadosModule {}