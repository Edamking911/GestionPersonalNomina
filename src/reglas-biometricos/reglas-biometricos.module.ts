import { Module } from '@nestjs/common';
import { ReglasBiometricosService } from './reglas-biometricos.service';
import { ReglasBiometricosController } from './reglas-biometricos.controller';
import { BiometricoService } from 'src/biometrico/biometrico.service';

@Module({
  controllers: [ReglasBiometricosController],
  providers: [ReglasBiometricosService, BiometricoService],
  exports: [ReglasBiometricosService],
})
export class ReglasBiometricosModule {}
