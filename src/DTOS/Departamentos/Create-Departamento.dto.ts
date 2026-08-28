import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartamentoDto {
  @ApiProperty({
    example: 'Recursos Humanos',
    description: 'Nombre del departamento',
  })
  @IsNotEmpty({ message: 'El nombre del departamento no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  nombre!: string;

  @ApiProperty({
    example: 'RRHH',
    description: 'Código único del departamento',
  })
  @IsNotEmpty({ message: 'El código del departamento no puede estar vacío' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El código no puede superar los 100 caracteres' })
  codigo!: string;
}
