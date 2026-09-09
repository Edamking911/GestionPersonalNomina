import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHistoricoSalarioDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del empleado (UUID)',
  })
  @IsNotEmpty({ message: 'El ID del empleado es obligatorio' })
  @IsUUID('4', { message: 'El ID del empleado debe ser un UUID válido' })
  empleadoId!: string;

  @ApiProperty({ example: 5000.0, description: 'Monto del sueldo' })
  @IsNotEmpty({ message: 'El monto del sueldo es obligatorio' })
  @IsNumber({}, { message: 'El monto del sueldo debe ser un número' })
  @Min(0, { message: 'El monto del sueldo no puede ser negativo' })
  montoSueldo!: number;

  @ApiProperty({
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    description: 'ID de la moneda (UUID)',
  })
  @IsNotEmpty({ message: 'El ID de la moneda es obligatorio' })
  @IsUUID('4', { message: 'El ID de la moneda debe ser un UUID válido' })
  monedaId!: string;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Fecha de inicio del salario (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @IsDateString(
    {},
    { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fechaInicio!: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Fecha de fin del salario (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fechaFin?: string;
}
