import { Test, TestingModule } from '@nestjs/testing';
import { TasaCambioController } from './tasa_cambio.controller';
import { TasaCambioService } from './tasa_cambio.service';

describe('TasaCambioController', () => {
  let controller: TasaCambioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasaCambioController],
      providers: [TasaCambioService],
    }).compile();

    controller = module.get<TasaCambioController>(TasaCambioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
