import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateHorarioAsistenciaDto } from './CreateHorarioAsistencia.dto';

export class CargarHorariosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateHorarioAsistenciaDto)
  horarios!: CreateHorarioAsistenciaDto[];
}