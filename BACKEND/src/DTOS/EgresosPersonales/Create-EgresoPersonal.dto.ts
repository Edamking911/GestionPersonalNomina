import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEgresoPersonalDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del empleado (UUID)',
  })
  @IsNotEmpty({ message: 'El ID del empleado es obligatorio' })
  @IsUUID('4', { message: 'El ID del empleado debe ser un UUID válido' })
  empleadoId!: string;

  @ApiProperty({
    example: '2026-08-28',
    description: 'Fecha de egreso (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'La fecha de egreso es obligatoria' })
  @IsDateString(
    {},
    { message: 'La fecha de egreso debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fechaEgreso!: string;

  @ApiProperty({
    example: 'Renuncia voluntaria',
    description: 'Motivo del egreso',
  })
  @IsNotEmpty({ message: 'El motivo del egreso es obligatorio' })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MaxLength(500, { message: 'El motivo no puede superar los 500 caracteres' })
  motivo!: string;
}
