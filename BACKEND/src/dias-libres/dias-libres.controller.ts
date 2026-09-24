import { Controller } from '@nestjs/common';
import { DiasLibresService } from './dias-libres.service';

@Controller('dias-libres')
export class DiasLibresController {
  constructor(private readonly diasLibresService: DiasLibresService) {}
}
