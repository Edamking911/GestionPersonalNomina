import { PartialType } from '@nestjs/mapped-types';
import { CreateFeriadoDto } from './CreateFeriado.dto';

export class UpdateFeriadoDto extends PartialType(CreateFeriadoDto) {}