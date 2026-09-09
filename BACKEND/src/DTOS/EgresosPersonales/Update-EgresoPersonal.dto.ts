import { PartialType } from '@nestjs/mapped-types';
import { CreateEgresoPersonalDto } from './Create-EgresoPersonal.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEgresoPersonalDto extends PartialType(CreateEgresoPersonalDto) {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del empleado (UUID)',
    required: false,
  })
  declare empleadoId?: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Fecha de egreso (YYYY-MM-DD)',
    required: false,
  })
  declare fechaEgreso?: string;

  @ApiProperty({
    example: 'Renuncia voluntaria',
    description: 'Motivo del egreso',
    required: false,
  })
  declare motivo?: string;
}