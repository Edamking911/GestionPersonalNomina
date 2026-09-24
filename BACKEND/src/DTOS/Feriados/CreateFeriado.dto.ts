import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  Length,
} from 'class-validator';

export class CreateFeriadoDto {
  @IsDateString({}, { message: 'fecha debe ser formato YYYY-MM-DD' })
  @IsNotEmpty()
  fecha!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  pais?: string;
}