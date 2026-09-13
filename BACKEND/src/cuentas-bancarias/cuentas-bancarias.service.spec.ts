import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CuentaBancaria } from '../Entitys/CuentasBancarias/CuentaBancaria.entity';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';

describe('CuentasBancariasService', () => {
  let service: CuentasBancariasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CuentasBancariasService,
        {
          provide: getRepositoryToken(CuentaBancaria),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn(),
            })),
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

    service = module.get<CuentasBancariasService>(CuentasBancariasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
