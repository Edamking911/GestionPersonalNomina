import { Test, TestingModule } from '@nestjs/testing';
import { DiasLibresService } from './dias-libres.service';

describe('DiasLibresService', () => {
  let service: DiasLibresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiasLibresService],
    }).compile();

    service = module.get<DiasLibresService>(DiasLibresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
