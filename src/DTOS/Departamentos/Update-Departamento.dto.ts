import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartamentoDto } from './Create-Departamento.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDepartamentoDto extends PartialType(CreateDepartamentoDto) {
  @ApiProperty({
    example: 'Recursos Humanos',
    description: 'Nombre del departamento',
    required: false,
  })
  declare nombre?: string;

  @ApiProperty({
    example: 'RRHH',
    description: 'Código único del departamento',
    required: false,
  })
  declare codigo?: string;
}
