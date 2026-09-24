import { PartialType } from '@nestjs/mapped-types';
import { CreateEmpleadoDto } from './Create-Empleado.dto';

export class UpdateEmpleadoDto extends PartialType(
  CreateEmpleadoDto,
) {}