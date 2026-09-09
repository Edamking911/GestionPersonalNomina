import { PartialType } from '@nestjs/mapped-types';
import { CreateEmpleadoDto } from './Create-Empleado.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmpleadoDto extends PartialType(CreateEmpleadoDto) {
  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del empleado',
    required: false,
  })
  declare nombre?: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido del empleado',
    required: false,
  })
  declare apellido?: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del cargo (UUID)',
    required: false,
  })
  declare cargoId?: string;

  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    description: 'ID del departamento (UUID)',
    required: false,
  })
  declare departamentoId?: string;

  @ApiProperty({
    example: 'ACTIVO',
    description: 'Estado del empleado',
    enum: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'],
    required: false,
  })
  declare estado?: string;
}
