import { Test, TestingModule } from '@nestjs/testing';
import { EgresosPersonalesController } from './egresos-personales.controller';
import { EgresosPersonalesService } from './egresos-personales.service';

describe('EgresosPersonalesController', () => {
  let controller: EgresosPersonalesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EgresosPersonalesController],
      providers: [
        {
          provide: EgresosPersonalesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByEmpleado: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EgresosPersonalesController>(
      EgresosPersonalesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
