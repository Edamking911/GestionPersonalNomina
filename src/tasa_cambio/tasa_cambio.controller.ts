import { Controller } from '@nestjs/common';
import { TasaCambioService } from './tasa_cambio.service';

@Controller('tasa-cambio')
export class TasaCambioController {
  constructor(private readonly tasaCambioService: TasaCambioService) {}
}
