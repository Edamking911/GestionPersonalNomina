import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmpleadosService } from './empleados.service';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';
import { Cargo } from '../Entitys/Cargos/Cargos.entity';
import { Departamento } from '../Entitys/Departamentos/Departamentos.entity';
import { CuentaBancaria } from '../Entitys/CuentasBancarias/CuentaBancaria.entity';
import { EgresoPersonal } from '../Entitys/EgresosPersonales/EgresoPersonal.entity';
import { HistoricoSalario } from '../Entitys/HistoricosSalarios/HistoricoSalario.entity';

describe('EmpleadosService', () => {
  let service: EmpleadosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpleadosService,
        {
          provide: getRepositoryToken(Empleado),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
              getOne: jest.fn(),
            })),
            softDelete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Cargo),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Departamento),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CuentaBancaria),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
          },
        },
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
          provide: getRepositoryToken(HistoricoSalario),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmpleadosService>(EmpleadosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});