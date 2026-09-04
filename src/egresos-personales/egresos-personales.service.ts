import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EgresoPersonal } from '../Entitys/EgresosPersonales/EgresoPersonal.entity';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';
import { CreateEgresoPersonalDto } from '../DTOS/EgresosPersonales/Create-EgresoPersonal.dto';
import { UpdateEgresoPersonalDto } from '../DTOS/EgresosPersonales/Update-EgresoPersonal.dto';

@Injectable()
export class EgresosPersonalesService {
  constructor(
    @InjectRepository(EgresoPersonal)
    private readonly egresoRepository: Repository<EgresoPersonal>,
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

  validarFechaNoFutura(fechaEgreso: string): void {
    const fecha = new Date(fechaEgreso);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fecha > hoy) {
      throw new BadRequestException('La fecha de egreso no puede ser futura');
    }
  }

  async create(createDto: CreateEgresoPersonalDto): Promise<EgresoPersonal> {
    await this.validarEmpleado(createDto.empleadoId);
    this.validarFechaNoFutura(createDto.fechaEgreso);

    const egreso = this.egresoRepository.create({
      empleadoId: createDto.empleadoId,
      fechaEgreso: createDto.fechaEgreso,
      motivo: createDto.motivo,
    });

    return await this.egresoRepository.save(egreso);
  }

  async findAll(): Promise<EgresoPersonal[]> {
    return await this.egresoRepository.find({
      relations: { empleado: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmpleado(empleadoId: string): Promise<EgresoPersonal[]> {
    await this.validarEmpleado(empleadoId);
    return await this.egresoRepository.find({
      where: { empleadoId },
      relations: { empleado: true },
      order: { fechaEgreso: 'DESC' },
    });
  }

  async findOne(id: string): Promise<EgresoPersonal> {
    const egreso = await this.egresoRepository.findOne({
      where: { id },
      relations: { empleado: true },
    });
    if (!egreso) {
      throw new NotFoundException(`Egreso personal con ID ${id} no encontrado`);
    }
    return egreso;
  }

  async update(
    id: string,
    updateDto: UpdateEgresoPersonalDto,
  ): Promise<EgresoPersonal> {
    const egreso = await this.findOne(id);

    if (updateDto.empleadoId && updateDto.empleadoId !== egreso.empleadoId) {
      await this.validarEmpleado(updateDto.empleadoId);
    }

    if (updateDto.fechaEgreso) {
      this.validarFechaNoFutura(updateDto.fechaEgreso);
    }

    Object.assign(egreso, {
      ...(updateDto.empleadoId && { empleadoId: updateDto.empleadoId }),
      ...(updateDto.fechaEgreso && { fechaEgreso: updateDto.fechaEgreso }),
      ...(updateDto.motivo && { motivo: updateDto.motivo }),
    });

    return await this.egresoRepository.save(egreso);
  }

  async remove(id: string): Promise<EgresoPersonal> {
    const egreso = await this.findOne(id);
    return await this.egresoRepository.remove(egreso);
  }
}