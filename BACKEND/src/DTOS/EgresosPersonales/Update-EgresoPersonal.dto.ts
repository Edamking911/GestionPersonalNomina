import { PartialType } from '@nestjs/mapped-types';
import { CreateEgresoPersonalDto } from './Create-EgresoPersonal.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEgresoPersonalDto extends PartialType(
  CreateEgresoPersonalDto,
) {
  @ApiProperty({
    example: '2026-08-28',
    description: 'Fecha de egreso (YYYY-MM-DD)',
    required: false,
  })
  declare fechaEgreso?: string;

  @ApiProperty({
    example: 'Despido justificado',
    description: 'Motivo del egreso',
    required: false,
  })
  declare motivo?: string;
}
