import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonedaService } from './moneda.service';
import { MonedaController } from './moneda.controller';
import { Moneda } from 'src/Entitys/Moneda/Moneda.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Moneda
  ])],
  controllers: [MonedaController],
  providers: [MonedaService],
})
export class MonedaModule {}
