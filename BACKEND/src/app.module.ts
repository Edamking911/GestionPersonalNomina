import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import {TypeOrmModule} from '@nestjs/typeorm'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BiometricoModule } from './biometrico/biometrico.module';
import { DepartamentosModule } from './departamentos/departamentos.module';
import { CargosModule } from './cargos/cargos.module';
<<<<<<< Updated upstream:src/app.module.ts
import { MonedaModule } from './moneda/moneda.module';
import { TasaCambioModule } from './tasa_cambio/tasa_cambio.module';
=======
import { CuentasBancariasModule } from './cuentas-bancarias/cuentas-bancarias.module';
import { EgresosPersonalesModule } from './egresos-personales/egresos-personales.module';

import { EmpleadosModule } from './empleados/empleados.module';
import { MonedaModule } from './moneda/moneda.module';
import { TasaCambioModule } from './tasa_cambio/tasa_cambio.module';
import { BiometricoModule } from './biometrico/biometrico.module';
>>>>>>> Stashed changes:BACKEND/src/app.module.ts
import { ReglasBiometricosModule } from './reglas-biometricos/reglas-biometricos.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
<<<<<<< Updated upstream:src/app.module.ts
    type : 'postgres',
    host:'localhost',
    port: 5432,
    username: 'postgres',
    password: '123456',
    database: 'GestionPersonal',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false
  }),
=======
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'admin',
      database: 'GestionPersonal',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
>>>>>>> Stashed changes:BACKEND/src/app.module.ts
    ScheduleModule.forRoot(),
    BiometricoModule,
    DepartamentosModule,
    CargosModule,
    MonedaModule,
    TasaCambioModule,
<<<<<<< Updated upstream:src/app.module.ts
    ReglasBiometricosModule,
=======
<<<<<<< HEAD:BACKEND/src/app.module.ts
    BiometricoModule,
    ReglasBiometricosModule,
=======
    // BiometricoModule,
    // ReglasBiometricosModule,
    EmpleadosModule,
>>>>>>> 6e20ba9a8c48b0c32f66e75bd26435f6ab5ff4ea:src/app.module.ts
>>>>>>> Stashed changes:BACKEND/src/app.module.ts
  ],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
