import { Test, TestingModule } from '@nestjs/testing';
import { TasaCambioService } from './tasa_cambio.service';

describe('TasaCambioService', () => {
  let service: TasaCambioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasaCambioService],
    }).compile();

    service = module.get<TasaCambioService>(TasaCambioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
