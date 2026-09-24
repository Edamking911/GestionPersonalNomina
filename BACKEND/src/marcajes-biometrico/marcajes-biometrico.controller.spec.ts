import { Test, TestingModule } from '@nestjs/testing';
import { MarcajesBiometricoController } from './marcajes-biometrico.controller';
import { MarcajesBiometricoService } from './marcajes-biometrico.service';

describe('MarcajesBiometricoController', () => {
  let controller: MarcajesBiometricoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarcajesBiometricoController],
      providers: [MarcajesBiometricoService],
    }).compile();

    controller = module.get<MarcajesBiometricoController>(MarcajesBiometricoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
