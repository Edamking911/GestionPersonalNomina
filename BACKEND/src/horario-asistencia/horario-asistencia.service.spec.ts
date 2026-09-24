import { Test, TestingModule } from '@nestjs/testing';
import { HorarioAsistenciaService } from './horario-asistencia.service';

describe('HorarioAsistenciaService', () => {
  let service: HorarioAsistenciaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HorarioAsistenciaService],
    }).compile();

    service = module.get<HorarioAsistenciaService>(HorarioAsistenciaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
