import { Test, TestingModule } from '@nestjs/testing';
import { BiometricoController } from './biometrico.controller';
import { BiometricoService } from './biometrico.service';

describe('BiometricoController', () => {
  let controller: BiometricoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BiometricoController],
      providers: [BiometricoService],
    }).compile();

    controller = module.get<BiometricoController>(BiometricoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
