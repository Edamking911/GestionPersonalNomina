import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateAsignacionHorarioDto {
  @IsUUID('4', { message: 'empleadoId debe ser UUID válido' })
  @IsNotEmpty()
  empleadoId!: string;

  @IsUUID('4', { message: 'horarioId debe ser UUID válido' })
  @IsNotEmpty()
  horarioId!: string;

  @IsOptional()
  @IsDateString({}, { message: 'fechaInicio debe ser formato YYYY-MM-DD' })
  fechaInicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fechaFin debe ser formato YYYY-MM-DD' })
  fechaFin?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}