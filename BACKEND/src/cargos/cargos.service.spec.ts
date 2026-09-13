import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CargosService } from './cargos.service';
import { Cargo } from '../Entitys/Cargos/Cargos.entity';
import { Departamento } from '../Entitys/Departamentos/Departamentos.entity';

describe('CargosService', () => {
  let service: CargosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CargosService,
        {
          provide: getRepositoryToken(Cargo),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Departamento),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CargosService>(CargosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
