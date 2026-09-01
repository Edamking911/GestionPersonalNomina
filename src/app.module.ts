import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartamentosModule } from './departamentos/departamentos.module';
import { CargosModule } from './cargos/cargos.module';
import { MonedaModule } from './moneda/moneda.module';
import { TasaCambioModule } from './tasa_cambio/tasa_cambio.module';
import { ReglasBiometricosModule } from './reglas-biometricos/reglas-biometricos.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123456',
      database: 'GestionPersonal',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    ScheduleModule.forRoot(),
    DepartamentosModule,
    CargosModule,
    CuentasBancariasModule,
    EgresosPersonalesModule,
    BiometricoModule,
    DepartamentosModule,
    CargosModule,
    MonedaModule,
    TasaCambioModule,
    ReglasBiometricosModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
