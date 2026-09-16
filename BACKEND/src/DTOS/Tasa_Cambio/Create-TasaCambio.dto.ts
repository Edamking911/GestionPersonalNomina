import { IsUUID, IsNotEmpty, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateTasaCambioDto {
  @IsUUID()
  @IsNotEmpty()
  monedaId!: string;

  @IsNumber()
  @IsNotEmpty()
  tasa!: number;
}