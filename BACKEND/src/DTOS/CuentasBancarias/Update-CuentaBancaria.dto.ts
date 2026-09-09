import { PartialType } from '@nestjs/mapped-types';
import { CreateCuentaBancariaDto } from './Create-CuentaBancaria.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCuentaBancariaDto extends PartialType(
  CreateCuentaBancariaDto,
) {
  @ApiProperty({
    example: 'Banco de Venezuela',
    description: 'Nombre del banco',
    required: false,
  })
  declare banco?: string;

  @ApiProperty({
    example: '01020304050607080910',
    description: 'Número de cuenta bancaria',
    required: false,
  })
  declare numeroCuenta?: string;

  @ApiProperty({
    example: true,
    description: 'Indica si es la cuenta principal',
    required: false,
  })
  declare esPrincipal?: boolean;
}
