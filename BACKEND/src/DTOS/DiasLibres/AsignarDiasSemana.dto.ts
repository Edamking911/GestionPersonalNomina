import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class AsignarDiasSemanaDto {
  @IsUUID('4')
  @IsNotEmpty()
  empleadoId!: string;

  @IsDateString({}, { message: 'semanaInicio debe ser formato YYYY-MM-DD' })
  @IsNotEmpty()
  semanaInicio!: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  diasLibres!: number[];
}