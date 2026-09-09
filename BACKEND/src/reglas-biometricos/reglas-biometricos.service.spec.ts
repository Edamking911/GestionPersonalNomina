import { Test, TestingModule } from '@nestjs/testing';
import { ReglasBiometricosService } from './reglas-biometricos.service';

describe('ReglasBiometricosService', () => {
  let service: ReglasBiometricosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReglasBiometricosService],
    }).compile();

    service = module.get<ReglasBiometricosService>(ReglasBiometricosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
