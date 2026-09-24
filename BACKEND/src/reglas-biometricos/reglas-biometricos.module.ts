import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReglasBiometricosService } from './reglas-biometricos.service';
import { ReglasConfigService } from './Configs/reglas-config.service';
import { CacheEmpleadosService } from './Cache/cache-empleados.service';
import { EvaluacionService } from './Evaluacion/evaluacion.service';
import { ReportesService } from './Reportes/reportes.service';
import { AsignacionesService } from './Asignaciones/asignaciones.service';
import { NovedadesService } from './Novedades/novedades.service';
import { NovedadesReporteService } from './Novedades/novedades-reporte.service';
import { NovedadesPdfService } from './Novedades/novedades-pdf.service';
import { NovedadesController } from './Novedades/novedades.controller';
import { ReglasBiometricosController } from './reglas-biometricos.controller';
import { BiometricoService } from 'src/biometrico/biometrico.service';
import { BiometricoModule } from '../biometrico/biometrico.module';
import { EmpleadosSyncService } from './empleados/empleados-sync.service';
import { MigracionJsonService } from './Migracion/migracion-json.service';

import { HorarioAsistencia } from '../Entitys/HorariosAsistencia/HorarioAsistencia.entity';
import { AsignacionHorario } from '../Entitys/AsignacionHorario/AsignacionHorario.entity';
import { DiaLibre } from '../Entitys/DiaLibre/DiaLibre.entity';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';
import { NovedadNomina } from 'src/Entitys/Novedades/NovedadNomina.entity';

@Module({
  imports: [
    BiometricoModule,
    TypeOrmModule.forFeature([
      HorarioAsistencia,
      AsignacionHorario,
      DiaLibre,
      Empleado,
      NovedadNomina,
    ]),
  ],
  controllers: [
    ReglasBiometricosController,
    NovedadesController,
  ],
  providers: [
    ReglasBiometricosService,
    BiometricoService,
    ReglasConfigService,
    CacheEmpleadosService,
    EvaluacionService,
    ReportesService,
    AsignacionesService,
    EmpleadosSyncService,
    MigracionJsonService,
    NovedadesService,
    NovedadesReporteService,  // ⬅️ ESTE FALTABA
    NovedadesPdfService,       // ⬅️ ESTE TAMBIÉN
  ],
  exports: [
    ReglasBiometricosService,
    ReglasConfigService,
  ],
})
export class ReglasBiometricosModule {}