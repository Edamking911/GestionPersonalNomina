import { Controller } from '@nestjs/common';
import { MarcajesBiometricoService } from './marcajes-biometrico.service';

@Controller('marcajes-biometrico')
export class MarcajesBiometricoController {
  constructor(private readonly marcajesBiometricoService: MarcajesBiometricoService) {}
}
