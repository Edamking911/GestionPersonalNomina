import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCargoDto {
  @ApiProperty({
    example: 'Desarrollador Senior',
    description: 'Nombre del cargo',
  })
  @IsNotEmpty({ message: 'El nombre del cargo no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  nombre!: string;


  @ApiProperty({
    example: '350.00',
    description: 'Asignacion de sueldo',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El sueldo debe tener máximo 2 decimales' })
  @Min(0, { message: 'El sueldo no puede ser negativo' })
  @Max(9999999999.99, { message: 'El sueldo excede el máximo permitido' })
  sueldo!: number;
}
