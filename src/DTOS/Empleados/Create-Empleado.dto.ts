import { IsNotEmpty, IsString, IsUUID, IsEmail, IsOptional, MaxLength, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpleadoDto {
  @ApiProperty({ example: 'V-12345678', description: 'Cédula de identidad (única)' })
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
  @MaxLength(100, { message: 'El apellido no puede superar los 100 caracteres' })
  apellido!: string;

  @ApiProperty({ example: 'juan.perez@empresa.com', description: 'Email del empleado (único)' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(150, { message: 'El email no puede superar los 150 caracteres' })
  email!: string;

  @ApiProperty({ example: '0412-1234567', description: 'Teléfono del empleado', required: false })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono no puede superar los 20 caracteres' })
  telefono?: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha de ingreso (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'La fecha de ingreso es obligatoria' })
  @IsDateString({}, { message: 'La fecha de ingreso debe ser una fecha válida (YYYY-MM-DD)' })
  fechaIngreso!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'ID del cargo (UUID)', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del cargo debe ser un UUID válido' })
  cargoId?: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', description: 'ID del departamento (UUID)', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del departamento debe ser un UUID válido' })
  departamentoId?: string;

  @ApiProperty({ example: 'ACTIVO', description: 'Estado del empleado', enum: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'], required: false })
  @IsOptional()
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsIn(['ACTIVO', 'INACTIVO', 'SUSPENDIDO'], { message: 'El estado debe ser ACTIVO, INACTIVO o SUSPENDIDO' })
  estado?: string;
}