import { Test, TestingModule } from '@nestjs/testing';
import { ControlVacionesController } from './control_vaciones.controller';
import { ControlVacionesService } from './control_vaciones.service';

describe('ControlVacionesController', () => {
  let controller: ControlVacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControlVacionesController],
      providers: [ControlVacionesService],
    }).compile();

    controller = module.get<ControlVacionesController>(ControlVacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
