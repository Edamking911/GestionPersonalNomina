import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControlVacionesService } from './control_vaciones.service';
import { ControlVacionesController } from './control_vaciones.controller';
import { ControlVacaciones } from 'src/Entitys/Control_Vacaciones/ControlVacaciones.entity';
import { VacacionesGeneradorService } from 'src/control_vaciones/vacaciones-generador.service';
import { Empleado } from 'src/Entitys/Empleados/Empleado.entity';
import { Feriado } from 'src/Entitys/Feriado/Feriado.entity';
import { NovedadNomina } from 'src/Entitys/Novedades/NovedadNomina.entity';
import { DiaLibre } from 'src/Entitys/DiaLibre/DiaLibre.entity';
import { ReglasBiometricosModule } from 'src/reglas-biometricos/reglas-biometricos.module';

@Module({
  imports: [TypeOrmModule.forFeature([ControlVacaciones,Empleado, Feriado, NovedadNomina,DiaLibre]),forwardRef(() => ReglasBiometricosModule),],
  controllers: [ControlVacionesController],
  providers: [ControlVacionesService,VacacionesGeneradorService],
  exports: [ControlVacionesService,VacacionesGeneradorService]
})
export class ControlVacionesModule {}
