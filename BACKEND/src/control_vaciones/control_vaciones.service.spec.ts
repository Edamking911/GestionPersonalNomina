import { Test, TestingModule } from '@nestjs/testing';
import { ControlVacionesService } from './control_vaciones.service';

describe('ControlVacionesService', () => {
  let service: ControlVacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ControlVacionesService],
    }).compile();

    service = module.get<ControlVacionesService>(ControlVacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
