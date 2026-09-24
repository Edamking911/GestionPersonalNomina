import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class CreateDiaLibreDto {
  @IsUUID('4')
  @IsNotEmpty()
  empleadoId!: string;

  @IsIn(['FIJO', 'ROTATIVO'], {
    message: 'tipo debe ser FIJO o ROTATIVO',
  })
  tipo!: 'FIJO' | 'ROTATIVO';

  @IsInt()
  @Min(0, { message: 'diaSemana debe estar entre 0 (domingo) y 6 (sábado)' })
  @Max(6, { message: 'diaSemana debe estar entre 0 (domingo) y 6 (sábado)' })
  diaSemana!: number;

  @IsOptional()
  @IsDateString({}, { message: 'semanaInicio debe ser formato YYYY-MM-DD' })
  semanaInicio?: string;
}