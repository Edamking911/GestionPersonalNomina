import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCargoDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del departamento (UUID)',
  })
  @IsNotEmpty({ message: 'El ID del departamento es obligatorio' })
  @IsUUID('4', { message: 'El ID del departamento debe ser un UUID válido' })
  departamentoId!: string;

  @ApiProperty({
    example: 'Desarrollador Senior',
    description: 'Nombre del cargo',
  })
  @IsNotEmpty({ message: 'El nombre del cargo no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  nombre!: string;
}
