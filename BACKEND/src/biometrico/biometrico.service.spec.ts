import { Test, TestingModule } from '@nestjs/testing';
import { BiometricoService } from './biometrico.service';

describe('BiometricoService', () => {
  let service: BiometricoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BiometricoService],
    }).compile();

    service = module.get<BiometricoService>(BiometricoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
