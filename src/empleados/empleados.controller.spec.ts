import { Test, TestingModule } from '@nestjs/testing';
import { EmpleadosController } from './empleados.controller';
import { EmpleadosService } from './empleados.service';

describe('EmpleadosController', () => {
  let controller: EmpleadosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmpleadosController],
      providers: [
        {
          provide: EmpleadosService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByCedula: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            toggleEstado: jest.fn(),
            softDelete: jest.fn(),
            remove: jest.fn(),
            addHistoricoSalario: jest.fn(),
            getHistoricoSalarios: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmpleadosController>(EmpleadosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});