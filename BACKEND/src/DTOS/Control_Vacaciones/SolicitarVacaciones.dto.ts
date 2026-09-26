import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SolicitarVacacionesDto {
  @ApiProperty({ example: '22652518', description: 'Cédula del empleado' })
  @IsString()
  @IsNotEmpty()
  cedula!: string;

  @ApiProperty({ example: '2026-10-05', description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsDateString()
  fechaInicio!: string;

  @ApiProperty({
    example: 15,
    description: 'Opcional. Días a tomar. Si no se manda, toma todos los disponibles del período más antiguo.',
    required: false,
  })
  @IsOptional()
  diasSolicitados?: number;

  @ApiProperty({ example: 'Vacaciones anuales', required: false })
  @IsOptional()
  @IsString()
  motivo?: string;
}