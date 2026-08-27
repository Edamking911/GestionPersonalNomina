import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartamentosService } from './departamentos.service';
import { DepartamentosController } from './departamentos.controller';
import { Departamento } from 'src/Entitys/Departamentos/Departamentos.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      Departamento
    ])
  ],
  controllers: [DepartamentosController],
  providers: [DepartamentosService],
})
export class DepartamentosModule {}
