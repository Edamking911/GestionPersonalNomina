import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioAsistenciaService } from './horario-asistencia.service';
import { HorarioAsistenciaController } from './horario-asistencia.controller';
import { HorarioAsistencia } from '../Entitys/HorariosAsistencia/HorarioAsistencia.entity';
@Module({
  imports: [TypeOrmModule.forFeature([HorarioAsistencia])],
  controllers: [HorarioAsistenciaController],
  providers: [HorarioAsistenciaService],
})
export class HorarioAsistenciaModule {}
