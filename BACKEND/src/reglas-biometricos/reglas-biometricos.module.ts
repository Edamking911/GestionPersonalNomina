import { Module } from '@nestjs/common';
import { ReglasBiometricosService } from './reglas-biometricos.service';
import { ReglasConfigService } from './Configs/reglas-config.service';
import { CacheEmpleadosService } from './Cache/cache-empleados.service';
import { EvaluacionService } from './Evaluacion/evaluacion.service';
import { ReportesService } from './Reportes/reportes.service';
import { AsignacionesService } from './Asignaciones/asignaciones.service';
import { BackupsService } from './Backups/backups.service';
import { ReglasBiometricosController } from './reglas-biometricos.controller';
import { BiometricoService } from 'src/biometrico/biometrico.service';
import {BiometricoModule} from '../biometrico/biometrico.module'
@Module({
  imports: [BiometricoModule],
  controllers: [ReglasBiometricosController],
  providers: [ReglasBiometricosService,BiometricoService,ReglasConfigService,CacheEmpleadosService,EvaluacionService,ReportesService,AsignacionesService,BackupsService],
  exports: [ReglasBiometricosService]
})
export class ReglasBiometricosModule {}
