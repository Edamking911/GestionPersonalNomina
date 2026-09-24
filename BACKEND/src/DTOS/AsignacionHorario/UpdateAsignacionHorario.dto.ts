import { PartialType } from '@nestjs/mapped-types';
import { CreateAsignacionHorarioDto } from './CreateAsignacionHorario.dto';

export class UpdateAsignacionHorarioDto extends PartialType(
  CreateAsignacionHorarioDto,
) {}