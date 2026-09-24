import { PartialType } from '@nestjs/mapped-types';
import { CreateHorarioAsistenciaDto } from './CreateHorarioAsistencia.dto';

export class UpdateHorarioAsistenciaDto extends PartialType(
  CreateHorarioAsistenciaDto,
) {}