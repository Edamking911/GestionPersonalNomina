import { PartialType } from '@nestjs/mapped-types';
import { CreateMonedaDto } from './Create-Moneda.dto';

export class UpdateMonedaDto extends PartialType(CreateMonedaDto) {}
