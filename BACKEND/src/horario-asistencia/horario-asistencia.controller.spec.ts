import { Test, TestingModule } from '@nestjs/testing';
import { HorarioAsistenciaController } from './horario-asistencia.controller';
import { HorarioAsistenciaService } from './horario-asistencia.service';

describe('HorarioAsistenciaController', () => {
  let controller: HorarioAsistenciaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HorarioAsistenciaController],
      providers: [HorarioAsistenciaService],
    }).compile();

    controller = module.get<HorarioAsistenciaController>(HorarioAsistenciaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
