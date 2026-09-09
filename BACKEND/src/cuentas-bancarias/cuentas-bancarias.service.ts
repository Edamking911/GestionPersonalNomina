import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuentaBancaria } from '../Entitys/CuentasBancarias/CuentaBancaria.entity';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';
import { CreateCuentaBancariaDto } from '../DTOS/CuentasBancarias/Create-CuentaBancaria.dto';
import { UpdateCuentaBancariaDto } from '../DTOS/CuentasBancarias/Update-CuentaBancaria.dto';

@Injectable()
export class CuentasBancariasService {
  constructor(
    @InjectRepository(CuentaBancaria)
    private readonly cuentaRepository: Repository<CuentaBancaria>,
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
  ) {}

  async validarEmpleado(empleadoId: string): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findOne({
      where: { id: empleadoId },
    });
    if (!empleado) {
      throw new NotFoundException(
        `Empleado con ID ${empleadoId} no encontrado`,
      );
    }
    return empleado;
  }

  async validarCuentaPrincipalUnica(
    empleadoId: string,
    esPrincipal: boolean,
    excludeId?: string,
  ): Promise<void> {
    if (!esPrincipal) return;

    const query = this.cuentaRepository
      .createQueryBuilder('cuenta')
      .where('cuenta.empleadoId = :empleadoId', { empleadoId })
      .andWhere('cuenta.esPrincipal = true');

    if (excludeId) {
      query.andWhere('cuenta.id != :excludeId', { excludeId });
    }

    const existe = await query.getOne();
    if (existe) {
      throw new BadRequestException(
        'El empleado ya tiene una cuenta principal. Solo puede haber una cuenta principal por empleado.',
      );
    }
  }

  async create(createDto: CreateCuentaBancariaDto): Promise<CuentaBancaria> {
    await this.validarEmpleado(createDto.empleadoId);
    await this.validarCuentaPrincipalUnica(
      createDto.empleadoId,
      createDto.esPrincipal || false,
    );

    const cuenta = this.cuentaRepository.create({
      empleadoId: createDto.empleadoId,
      banco: createDto.banco,
      numeroCuentaEncrypted: createDto.numeroCuenta,
      esPrincipal: createDto.esPrincipal || false,
    });

    return await this.cuentaRepository.save(cuenta);
  }

  async findAll(): Promise<CuentaBancaria[]> {
    return await this.cuentaRepository.find({
      relations: { empleado: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmpleado(empleadoId: string): Promise<CuentaBancaria[]> {
    await this.validarEmpleado(empleadoId);
    return await this.cuentaRepository.find({
      where: { empleadoId },
      relations: { empleado: true },
      order: { esPrincipal: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CuentaBancaria> {
    const cuenta = await this.cuentaRepository.findOne({
      where: { id },
      relations: { empleado: true },
    });
    if (!cuenta) {
      throw new NotFoundException(`Cuenta bancaria con ID ${id} no encontrada`);
    }
    return cuenta;
  }

  async update(
    id: string,
    updateDto: UpdateCuentaBancariaDto,
  ): Promise<CuentaBancaria> {
    const cuenta = await this.findOne(id);

    if (updateDto.empleadoId && updateDto.empleadoId !== cuenta.empleadoId) {
      await this.validarEmpleado(updateDto.empleadoId);
    }

    const empleadoId = updateDto.empleadoId || cuenta.empleadoId;
    const esPrincipal =
      updateDto.esPrincipal !== undefined
        ? updateDto.esPrincipal
        : cuenta.esPrincipal;

    await this.validarCuentaPrincipalUnica(empleadoId, esPrincipal, id);

    Object.assign(cuenta, {
      ...(updateDto.banco && { banco: updateDto.banco }),
      ...(updateDto.numeroCuenta && {
        numeroCuentaEncrypted: updateDto.numeroCuenta,
      }),
      ...(updateDto.esPrincipal !== undefined && {
        esPrincipal: updateDto.esPrincipal,
      }),
    });

    return await this.cuentaRepository.save(cuenta);
  }

  async remove(id: string): Promise<CuentaBancaria> {
    const cuenta = await this.findOne(id);
    return await this.cuentaRepository.remove(cuenta);
  }
}
