import { Test, TestingModule } from '@nestjs/testing';
import { MonedaController } from './moneda.controller';
import { MonedaService } from './moneda.service';

describe('MonedaController', () => {
  let controller: MonedaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonedaController],
      providers: [MonedaService],
    }).compile();

    controller = module.get<MonedaController>(MonedaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
