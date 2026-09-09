import { Test, TestingModule } from '@nestjs/testing';
import { DepartamentosController } from './departamentos.controller';
import { DepartamentosService } from './departamentos.service';

describe('DepartamentosController', () => {
  let controller: DepartamentosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartamentosController],
      providers: [
        {
          provide: DepartamentosService,
          useValue: {
            Crear_Departamento: jest.fn(),
            Traer_Departamentos: jest.fn(),
            Buscar_Departamento: jest.fn(),
            Eliminar_Departamento: jest.fn(),
            Actualizar_Departamento: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DepartamentosController>(DepartamentosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
