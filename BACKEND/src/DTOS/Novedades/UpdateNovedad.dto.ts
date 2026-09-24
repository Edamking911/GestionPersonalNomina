import { PartialType } from '@nestjs/mapped-types';
import { CreateNovedadDto } from './CreateNovedad.dto';

export class UpdateNovedadDto extends PartialType(CreateNovedadDto) {}