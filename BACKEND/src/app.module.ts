import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import {TypeOrmModule} from '@nestjs/typeorm'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BiometricoModule } from './biometrico/biometrico.module';
import { DepartamentosModule } from './departamentos/departamentos.module';
import { CargosModule } from './cargos/cargos.module';
import {EgresosPersonalesModule} from './egresos-personales/egresos-personales.module';
import { MonedaModule } from './moneda/moneda.module';
import { TasaCambioModule } from './tasa_cambio/tasa_cambio.module';
import { ReglasBiometricosModule } from './reglas-biometricos/reglas-biometricos.module';
import { HorarioAsistenciaModule } from './horario-asistencia/horario-asistencia.module';
import { DiasLibresModule } from './dias-libres/dias-libres.module';
import { FeriadosModule } from './feriados/feriados.module';
import { MarcajesBiometricoModule } from './marcajes-biometrico/marcajes-biometrico.module';
import { EmpleadosModule } from './empleados/empleados.module';
import { ControlVacionesModule } from './control_vaciones/control_vaciones.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123456',
      database: 'Gestion_Personal',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      //autoLoadEntities: true,
      synchronize: false,
    }),
    ScheduleModule.forRoot(),
    BiometricoModule,
    DepartamentosModule,
    CargosModule,
    MonedaModule,
    TasaCambioModule,
    ReglasBiometricosModule,
    BiometricoModule,
    EgresosPersonalesModule,
    HorarioAsistenciaModule,
    DiasLibresModule,
    FeriadosModule,
    MarcajesBiometricoModule,
    EmpleadosModule,
    ControlVacionesModule,
  ],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
