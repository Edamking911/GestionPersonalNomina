import { IsUUID, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CambiarHorarioDto {
  @IsUUID('4')
  @IsNotEmpty()
  empleadoId!: string;

  @IsUUID('4')
  @IsNotEmpty()
  nuevoHorarioId!: string;

  @IsDateString()
  @IsNotEmpty()
  fechaCambio!: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}