import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartamentoDto } from './Create-Departamento.dto';

export class UpdateDepartamentoDto extends PartialType(CreateDepartamentoDto) {}