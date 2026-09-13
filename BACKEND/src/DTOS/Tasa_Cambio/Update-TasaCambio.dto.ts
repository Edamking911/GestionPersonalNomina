import { PartialType } from '@nestjs/mapped-types';
import { CreateTasaCambioDto } from './Create-TasaCambio.dto';

export class UpdateTasaCambioDto extends PartialType(CreateTasaCambioDto) {}
