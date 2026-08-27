import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCargoDto {
  @IsNotEmpty({ message: 'El ID del departamento es obligatorio' })
  @IsUUID('4', { message: 'El ID del departamento debe ser un UUID válido' })
  departamentoId!: string;

  @IsNotEmpty({ message: 'El nombre del cargo no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  nombre!: string;
}