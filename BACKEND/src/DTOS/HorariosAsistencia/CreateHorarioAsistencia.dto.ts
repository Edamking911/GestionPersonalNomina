import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  IsBoolean,
  IsMilitaryTime,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateHorarioAsistenciaDto {
  @IsString()
  @IsNotEmpty({ message: 'El código es obligatorio' })
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'El código solo puede tener mayúsculas, números y guión bajo',
  })
  codigo!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100)
  nombre!: string;

  @IsMilitaryTime({ message: 'horaEntrada debe ser formato HH:mm' })
  horaEntrada!: string;

  @IsMilitaryTime({ message: 'horaSalida debe ser formato HH:mm' })
  horaSalida!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  toleranciaMin?: number;

   // ⬇️ NUEVOS
  @IsOptional()
  @IsInt()
  @Min(0)
  breakDuracionMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  breakToleranciaMin?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  diasLaborales?: number[];

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}