import { Controller } from '@nestjs/common';
import { FeriadosService } from './feriados.service';

@Controller('feriados')
export class FeriadosController {
  constructor(private readonly feriadosService: FeriadosService) {}
}
