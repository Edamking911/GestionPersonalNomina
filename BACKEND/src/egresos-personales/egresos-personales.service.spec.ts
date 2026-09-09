import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EgresosPersonalesService } from './egresos-personales.service';
import { EgresoPersonal } from '../Entitys/EgresosPersonales/EgresoPersonal.entity';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';

describe('EgresosPersonalesService', () => {
  let service: EgresosPersonalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EgresosPersonalesService,
        {
          provide: getRepositoryToken(EgresoPersonal),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Empleado),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EgresosPersonalesService>(EgresosPersonalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
