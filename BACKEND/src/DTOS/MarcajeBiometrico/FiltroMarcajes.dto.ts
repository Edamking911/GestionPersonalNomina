import {
  IsOptional,
  IsDateString,
  IsString,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FiltroMarcajesDto {
  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsDateString({}, { message: 'desde debe ser formato YYYY-MM-DD' })
  desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'hasta debe ser formato YYYY-MM-DD' })
  hasta?: string;

  @IsOptional()
  @IsIn(['BIOMETRICO', 'MANUAL'])
  origen?: 'BIOMETRICO' | 'MANUAL';

  @IsOptional()
  @IsIn(['HUELLA', 'TARJETA', 'PIN', 'FACIAL', 'MANUAL'])
  tipoMarcaje?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}