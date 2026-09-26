import { IsUUID, IsNotEmpty, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateTasaCambioDto {
  @IsUUID()
  @IsNotEmpty()
  monedaId!: number;

  @IsNumber()
  @IsNotEmpty()
  tasa!: number;
}