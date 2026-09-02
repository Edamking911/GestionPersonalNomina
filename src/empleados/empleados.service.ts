import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';
import { Cargo } from '../Entitys/Cargos/Cargos.entity';
import { Departamento } from '../Entitys/Departamentos/Departamentos.entity';
import { CuentaBancaria } from '../Entitys/CuentasBancarias/CuentaBancaria.entity';
import { EgresoPersonal } from '../Entitys/EgresosPersonales/EgresoPersonal.entity';
import { HistoricoSalario } from '../Entitys/HistoricosSalarios/HistoricoSalario.entity';
import { CreateEmpleadoDto } from '../DTOS/Empleados/Create-Empleado.dto';
import { UpdateEmpleadoDto } from '../DTOS/Empleados/Update-Empleado.dto';
import { CreateHistoricoSalarioDto } from '../DTOS/HistoricosSalarios/Create-HistoricoSalario.dto';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    @InjectRepository(Cargo)
    private readonly cargoRepository: Repository<Cargo>,
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>,
    @InjectRepository(CuentaBancaria)
    private readonly cuentaRepository: Repository<CuentaBancaria>,
    @InjectRepository(EgresoPersonal)
    private readonly egresoRepository: Repository<EgresoPersonal>,
    @InjectRepository(HistoricoSalario)
    private readonly historicoRepository: Repository<HistoricoSalario>,
  ) {}

  async validarCedulaUnica(cedula: string, excludeId?: string): Promise<void> {
    const query = this.empleadoRepository
      .createQueryBuilder('empleado')
      .where('empleado.cedula = :cedula', { cedula });

    if (excludeId) {
      query.andWhere('empleado.id != :excludeId', { excludeId });
    }

    const existe = await query.getOne();
    if (existe) {
      throw new ConflictException(`La cédula ${cedula} ya está registrada`);
    }
  }

  async validarEmailUnico(email: string, excludeId?: string): Promise<void> {
    const query = this.empleadoRepository
      .createQueryBuilder('empleado')
      .where('empleado.email = :email', { email });

    if (excludeId) {
      query.andWhere('empleado.id != :excludeId', { excludeId });
    }

    const existe = await query.getOne();
    if (existe) {
      throw new ConflictException(`El email ${email} ya está registrado`);
    }
  }

  async validarCargo(cargoId: string): Promise<Cargo> {
    const cargo = await this.cargoRepository.findOne({ where: { id: cargoId } });
    if (!cargo) {
      throw new NotFoundException(`Cargo con ID ${cargoId} no encontrado`);
    }
    return cargo;
  }

  async validarDepartamento(departamentoId: string): Promise<Departamento> {
    const departamento = await this.departamentoRepository.findOne({ where: { id: departamentoId } });
    if (!departamento) {
      throw new NotFoundException(`Departamento con ID ${departamentoId} no encontrado`);
    }
    return departamento;
  }

  async create(createDto: CreateEmpleadoDto): Promise<Empleado> {
    await this.validarCedulaUnica(createDto.cedula);
    await this.validarEmailUnico(createDto.email);

    if (createDto.cargoId) {
      await this.validarCargo(createDto.cargoId);
    }
    if (createDto.departamentoId) {
      await this.validarDepartamento(createDto.departamentoId);
    }

    const empleado = this.empleadoRepository.create({
      cedula: createDto.cedula,
      nombre: createDto.nombre,
      apellido: createDto.nombre,
      email: createDto.email,
      telefono: createDto.telefono,
      fechaIngreso: createDto.fechaIngreso,
      cargoId: createDto.cargoId,
      departamentoId: createDto.departamentoId,
      estado: createDto.estado || 'ACTIVO',
    });

    return await this.empleadoRepository.save(empleado);
  }

  async findAll(filters?: {
    nombre?: string;
    cedula?: string;
    cargoId?: string;
    departamentoId?: string;
    estado?: string;
  }): Promise<Empleado[]> {
    const query = this.empleadoRepository.createQueryBuilder('empleado')
      .leftJoinAndSelect('empleado.cargo', 'cargo')
      .leftJoinAndSelect('empleado.departamento', 'departamento');

    if (filters?.nombre) {
      query.andWhere('(empleado.nombre ILIKE :nombre OR empleado.apellido ILIKE :nombre)', { nombre: `%${filters.nombre}%` });
    }
    if (filters?.cedula) {
      query.andWhere('empleado.cedula ILIKE :cedula', { cedula: `%${filters.cedula}%` });
    }
    if (filters?.cargoId) {
      query.andWhere('empleado.cargoId = :cargoId', { cargoId: filters.cargoId });
    }
    if (filters?.departamentoId) {
      query.andWhere('empleado.departamentoId = :departamentoId', { departamentoId: filters.departamentoId });
    }
    if (filters?.estado) {
      query.andWhere('empleado.estado = :estado', { estado: filters.estado });
    }

    query.orderBy('empleado.createdAt', 'DESC');
    return await query.getMany();
  }

  async findByCedula(cedula: string): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findOne({
      where: { cedula },
      relations: {
        cargo: true,
        departamento: true,
        cuentasBancarias: true,
        egresosPersonales: true,
        historicoSalarios: true,
      },
    });
    if (!empleado) {
      throw new NotFoundException(`Empleado con cédula ${cedula} no encontrado`);
    }
    return empleado;
  }

  async findOne(id: string): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findOne({
      where: { id },
      relations: {
        cargo: true,
        departamento: true,
        cuentasBancarias: true,
        egresosPersonales: true,
        historicoSalarios: true,
      },
    });
    if (!empleado) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }
    return empleado;
  }

  async update(id: string, updateDto: UpdateEmpleadoDto): Promise<Empleado> {
    const empleado = await this.findOne(id);

    if (updateDto.cedula && updateDto.cedula !== empleado.cedula) {
      await this.validarCedulaUnica(updateDto.cedula, id);
    }
    if (updateDto.email && updateDto.email !== empleado.email) {
      await this.validarEmailUnico(updateDto.email, id);
    }
    if (updateDto.cargoId) {
      await this.validarCargo(updateDto.cargoId);
    }
    if (updateDto.departamentoId) {
      await this.validarDepartamento(updateDto.departamentoId);
    }

    Object.assign(empleado, {
      ...(updateDto.cedula && { cedula: updateDto.cedula }),
      ...(updateDto.nombre && { nombre: updateDto.nombre }),
      ...(updateDto.apellido && { apellido: updateDto.apellido }),
      ...(updateDto.email && { email: updateDto.email }),
      ...(updateDto.telefono !== undefined && { telefono: updateDto.telefono }),
      ...(updateDto.fechaIngreso && { fechaIngreso: updateDto.fechaIngreso }),
      ...(updateDto.cargoId !== undefined && { cargoId: updateDto.cargoId }),
      ...(updateDto.departamentoId !== undefined && { departamentoId: updateDto.departamentoId }),
      ...(updateDto.estado && { estado: updateDto.estado }),
    });

    return await this.empleadoRepository.save(empleado);
  }

  async toggleEstado(id: string): Promise<Empleado> {
    const empleado = await this.findOne(id);
    const nuevosEstados: Record<string, string> = {
      ACTIVO: 'INACTIVO',
      INACTIVO: 'ACTIVO',
      SUSPENDIDO: 'ACTIVO',
    };
    empleado.estado = nuevosEstados[empleado.estado] || 'ACTIVO';
    return await this.empleadoRepository.save(empleado);
  }

  async softDelete(id: string): Promise<Empleado> {
    const empleado = await this.findOne(id);
    empleado.estado = 'INACTIVO';
    await this.empleadoRepository.softDelete(id);
    return empleado;
  }

  async remove(id: string): Promise<Empleado> {
    const empleado = await this.findOne(id);
    return await this.empleadoRepository.remove(empleado);
  }

  async addHistoricoSalario(createDto: CreateHistoricoSalarioDto): Promise<HistoricoSalario> {
    await this.findOne(createDto.empleadoId);

    const historico = this.historicoRepository.create({
      empleadoId: createDto.empleadoId,
      montoSueldo: createDto.montoSueldo,
      monedaId: createDto.monedaId,
      fechaInicio: createDto.fechaInicio,
      fechaFin: createDto.fechaFin,
    });

    return await this.historicoRepository.save(historico);
  }

  async getHistoricoSalarios(empleadoId: string): Promise<HistoricoSalario[]> {
    await this.findOne(empleadoId);
    return await this.historicoRepository.find({
      where: { empleadoId },
      order: { fechaInicio: 'DESC' },
    });
  }
}