import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCuentaBancariaDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del empleado (UUID)',
  })
  @IsNotEmpty({ message: 'El ID del empleado es obligatorio' })
  @IsUUID('4', { message: 'El ID del empleado debe ser un UUID válido' })
  empleadoId!: string;

  @ApiProperty({
    example: 'Banco de Venezuela',
    description: 'Nombre del banco',
  })
  @IsNotEmpty({ message: 'El nombre del banco es obligatorio' })
  @IsString({ message: 'El banco debe ser una cadena de texto' })
  @MaxLength(100, {
    message: 'El nombre del banco no puede superar los 100 caracteres',
  })
  banco!: string;

  @ApiProperty({
    example: '01020304050607080910',
    description: 'Número de cuenta bancaria',
  })
  @IsNotEmpty({ message: 'El número de cuenta es obligatorio' })
  @IsString({ message: 'El número de cuenta debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El número de cuenta no puede superar los 50 caracteres',
  })
  numeroCuenta!: string;

  @ApiProperty({
    example: false,
    description: 'Indica si es la cuenta principal',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'esPrincipal debe ser un valor booleano' })
  esPrincipal?: boolean;
}
