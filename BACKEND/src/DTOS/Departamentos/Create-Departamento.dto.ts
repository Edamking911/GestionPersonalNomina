import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDepartamentoDto {
  @IsNotEmpty({ message: 'El nombre del departamento no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  nombre!: string;

  @IsNotEmpty({ message: 'El nombre del departamento no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  codigo!: string;

}