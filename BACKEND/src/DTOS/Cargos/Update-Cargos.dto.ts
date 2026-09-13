import { PartialType } from '@nestjs/mapped-types';
import { CreateCargoDto } from './Create-Cargos.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCargoDto extends PartialType(CreateCargoDto) {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del departamento (UUID)',
    required: false,
  })
  declare departamentoId?: string;

  @ApiProperty({
    example: 'Desarrollador Senior',
    description: 'Nombre del cargo',
    required: false,
  })
  declare nombre?: string;
}
