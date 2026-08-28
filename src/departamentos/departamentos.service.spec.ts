import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepartamentosService } from './departamentos.service';
import { Departamento } from '../Entitys/Departamentos/Departamentos.entity';

describe('DepartamentosService', () => {
  let service: DepartamentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartamentosService,
        {
          provide: getRepositoryToken(Departamento),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DepartamentosService>(DepartamentosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
