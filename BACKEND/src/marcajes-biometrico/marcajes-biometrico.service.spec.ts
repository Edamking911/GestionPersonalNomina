import { Test, TestingModule } from '@nestjs/testing';
import { MarcajesBiometricoService } from './marcajes-biometrico.service';

describe('MarcajesBiometricoService', () => {
  let service: MarcajesBiometricoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarcajesBiometricoService],
    }).compile();

    service = module.get<MarcajesBiometricoService>(MarcajesBiometricoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
