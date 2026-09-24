import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';

export const TIPOS_NOVEDAD = [
  'VACACIONES',
  'REPOSO_MEDICO',
  'PERMISO_REMUNERADO',
  'PERMISO_NO_REMUNERADO',
  'FALTA_JUSTIFICADA',
  'FALTA_INJUSTIFICADA',
] as const;

export type TipoNovedad = (typeof TIPOS_NOVEDAD)[number];

export class CreateNovedadDto {
  @IsString()
  @IsNotEmpty()
  employeeId !: string;

  @IsString()
  @IsIn(TIPOS_NOVEDAD as unknown as string[])
  tipo !: TipoNovedad;

  @IsDateString()
  fechaInicio !: string;

  @IsDateString()
  fechaFin !: string;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsString()
  documentoSoporte?: string;
}