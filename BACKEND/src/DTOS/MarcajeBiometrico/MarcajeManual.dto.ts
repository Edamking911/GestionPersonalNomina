import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class MarcajeManualDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cedula!: string;

  @IsOptional()
  @IsDateString({}, { message: 'fechaHora debe ser formato ISO 8601' })
  fechaHora?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}