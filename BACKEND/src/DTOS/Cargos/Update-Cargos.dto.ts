import { PartialType } from '@nestjs/mapped-types';
import { CreateCargoDto } from './Create-Cargos.dto';

export class UpdateCargoDto extends PartialType(CreateCargoDto) {}