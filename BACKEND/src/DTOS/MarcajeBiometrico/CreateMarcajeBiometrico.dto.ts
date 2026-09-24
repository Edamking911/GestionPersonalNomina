import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateMarcajeBiometricoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cedula!: string;

  @IsDateString({}, { message: 'fechaHora debe ser formato ISO 8601' })
  @IsNotEmpty()
  fechaHora!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dispositivoId?: string;

  @IsOptional()
  @IsIn(['HUELLA', 'TARJETA', 'PIN', 'FACIAL', 'MANUAL'])
  tipoMarcaje?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombreEmpleadoCache?: string;

  @IsOptional()
  @IsIn(['BIOMETRICO', 'MANUAL'])
  origen?: 'BIOMETRICO' | 'MANUAL';
}