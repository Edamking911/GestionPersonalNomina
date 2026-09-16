import { Test, TestingModule } from '@nestjs/testing';
import { ReglasBiometricosController } from './reglas-biometricos.controller';
import { ReglasBiometricosService } from './reglas-biometricos.service';

describe('ReglasBiometricosController', () => {
  let controller: ReglasBiometricosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReglasBiometricosController],
      providers: [ReglasBiometricosService],
    }).compile();

    controller = module.get<ReglasBiometricosController>(ReglasBiometricosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
