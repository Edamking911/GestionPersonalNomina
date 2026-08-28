import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { BiometricoController } from './biometrico.controller';
import { BiometricoService } from './biometrico.service';
import * as express from 'express';

@Module({
  controllers: [BiometricoController],
  providers: [BiometricoService],
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
