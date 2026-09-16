import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { BiometricoController } from './biometrico.controller';
import { BiometricoService } from './biometrico.service';
import * as express from 'express';
import { BiometricDeviceFactory } from './Factory/Biometrico-device.factory';
import { BiometricDeviceProvider } from './Providers/biometrico-device.provider';
import { MarcajesStorageService } from './Storage/marcajes-storage.service';
import { MarcajesSyncService } from './Async/marcajes-async.service';
import { UsuariosBiometricoService } from './Users/usuarios-biometrico.service';
import { MarcajesQueryService } from './Query/marcajes-query.service';

@Module({
  controllers: [BiometricoController],
  providers: [BiometricoService, BiometricDeviceFactory, BiometricDeviceProvider, MarcajesStorageService, MarcajesSyncService, UsuariosBiometricoService, MarcajesQueryService],
  exports: [BiometricDeviceFactory, BiometricoService, BiometricDeviceProvider, MarcajesStorageService, MarcajesSyncService, UsuariosBiometricoService, MarcajesQueryService]
})
export class BiometricoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      ? consumer
          .apply(
            express.text({
              type: ['text/xml', 'application/xml', 'text/plain'],
            }),
          )
          .forRoutes({ path: 'biometric/event', method: RequestMethod.POST })
      : null;
  }
}
