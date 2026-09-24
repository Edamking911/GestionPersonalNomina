import { Module } from '@nestjs/common';
import { DiasLibresService } from './dias-libres.service';
import { DiasLibresController } from './dias-libres.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaLibre} from '../Entitys/DiaLibre/DiaLibre.entity';
@Module({
  imports: [TypeOrmModule.forFeature([DiaLibre])],
  controllers: [DiasLibresController],
  providers: [DiasLibresService],
})
export class DiasLibresModule {}
