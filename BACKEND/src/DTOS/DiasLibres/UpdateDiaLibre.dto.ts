import { PartialType } from '@nestjs/mapped-types';
import { CreateDiaLibreDto } from './CreateDiaLibre.dto';

export class UpdateDiaLibreDto extends PartialType(CreateDiaLibreDto) {}