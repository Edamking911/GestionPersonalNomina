import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateMonedaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  codigo!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  simbolo!: string;
}