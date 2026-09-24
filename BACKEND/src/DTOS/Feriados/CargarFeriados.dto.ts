import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { CreateFeriadoDto } from './CreateFeriado.dto';

export class CargarFeriadosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateFeriadoDto)
  feriados!: CreateFeriadoDto[];
}