import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEmail,
  IsOptional,
  MaxLength,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpleadoDto {
  @ApiProperty({
    example: 'V-12345678',
    description: 'Cédula de identidad (única)',
  })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @MaxLength(20, { message: 'La cédula no puede superar los 20 caracteres' })
  cedula!: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del empleado' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  nombre!: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del empleado' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @MaxLength(100, {
    message: 'El apellido no puede superar los 100 caracteres',
  })
  apellido!: string;

  // ✅ CAMBIO: ahora es el NOMBRE del cargo, no el UUID
  @ApiProperty({
    example: 'Gerencia',
    description: 'Nombre del cargo (debe existir en BD)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El cargo debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El cargo no puede superar los 100 caracteres' })
  cargo?: string;

  @ApiProperty({
    example: 'ACTIVO',
    description: 'Estado del empleado',
    enum: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsIn(['ACTIVO', 'INACTIVO', 'SUSPENDIDO'], {
    message: 'El estado debe ser ACTIVO, INACTIVO o SUSPENDIDO',
  })
  estado?: string;

  @ApiProperty({
    example: 'juan.perez@empresa.com',
    description: 'Email del empleado',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser un correo válido' })
  @MaxLength(150, { message: 'El email no puede superar los 150 caracteres' })
  email?: string;

  @ApiProperty({
    example: '04141234567',
    description: 'Teléfono del empleado',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono no puede superar los 20 caracteres' })
  telefono?: string;

  @ApiProperty({
    example: '2026-01-15',
    description: 'Fecha de ingreso (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de ingreso debe tener formato YYYY-MM-DD' },
  )
  fechaIngreso?: string;
}