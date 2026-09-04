import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartamentosModule } from './departamentos/departamentos.module';
import { CargosModule } from './cargos/cargos.module';
import { CuentasBancariasModule } from './cuentas-bancarias/cuentas-bancarias.module';
import { EgresosPersonalesModule } from './egresos-personales/egresos-personales.module';

import { EmpleadosModule } from './empleados/empleados.module';
import { MonedaModule } from './moneda/moneda.module';
import { TasaCambioModule } from './tasa_cambio/tasa_cambio.module';
import { BiometricoModule } from './biometrico/biometrico.module';
import { ReglasBiometricosModule } from './reglas-biometricos/reglas-biometricos.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'admin',
      database: 'GestionPersonal',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    ScheduleModule.forRoot(),
    DepartamentosModule,
    CargosModule,
    CuentasBancariasModule,
    EgresosPersonalesModule,
    DepartamentosModule,
    CargosModule,
    MonedaModule,
    TasaCambioModule,
    // BiometricoModule,
    // ReglasBiometricosModule,
    EmpleadosModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
