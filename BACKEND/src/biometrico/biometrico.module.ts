import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BiometricoController } from './biometrico.controller';
import { BiometricoService } from './biometrico.service';
import * as express from 'express';
import { BiometricDeviceFactory } from './Factory/Biometrico-device.factory';
import { BiometricDeviceProvider } from './Providers/biometrico-device.provider';
import { MarcajesStorageService } from './Storage/marcajes-storage.service';
import { MarcajesSyncService } from './Async/marcajes-async.service';
import { UsuariosBiometricoService } from './Users/usuarios-biometrico.service';
import { MarcajesQueryService } from './Query/marcajes-query.service';
import { MarcajeBiometrico } from '../Entitys/MarcajeBiometrico/MarcajeBiometrico.entity';
import { Empleado } from 'src/Entitys/Empleados/Empleado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MarcajeBiometrico,Empleado])],
  controllers: [BiometricoController],
  providers: [
    BiometricoService,
    BiometricDeviceFactory,
    BiometricDeviceProvider,
    MarcajesStorageService,
    MarcajesSyncService,
    UsuariosBiometricoService,
    MarcajesQueryService,
  ],
  exports: [
    BiometricDeviceFactory,
    BiometricoService,
    BiometricDeviceProvider,
    MarcajesStorageService,
    MarcajesSyncService,
    UsuariosBiometricoService,
    MarcajesQueryService,
  ],
})
export class BiometricoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        express.text({
          type: ['text/xml', 'application/xml', 'text/plain'],
        }),
      )
      .forRoutes(
        { path: 'biometrico/event', method: RequestMethod.POST },
        { path: 'biometrico/webhook', method: RequestMethod.POST },
      );
  }
}