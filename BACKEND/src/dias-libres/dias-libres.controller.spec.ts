import { Test, TestingModule } from '@nestjs/testing';
import { DiasLibresController } from './dias-libres.controller';
import { DiasLibresService } from './dias-libres.service';

describe('DiasLibresController', () => {
  let controller: DiasLibresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiasLibresController],
      providers: [DiasLibresService],
    }).compile();

    controller = module.get<DiasLibresController>(DiasLibresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
