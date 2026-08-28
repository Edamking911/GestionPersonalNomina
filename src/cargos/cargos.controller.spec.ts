import { Test, TestingModule } from '@nestjs/testing';
import { CargosController } from './cargos.controller';
import { CargosService } from './cargos.service';

describe('CargosController', () => {
  let controller: CargosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CargosController],
      providers: [
        {
          provide: CargosService,
          useValue: {
            Create_Cargo: jest.fn(),
            Traer_Cargos: jest.fn(),
            Obtener_CargoEspecifico: jest.fn(),
            Eliminar_cargo: jest.fn(),
            Actualizar_Cargo: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CargosController>(CargosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
