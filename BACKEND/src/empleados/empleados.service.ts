import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';
import { Cargo } from '../Entitys/Cargos/Cargos.entity';
import { Departamento } from '../Entitys/Departamentos/Departamentos.entity';
import { CuentaBancaria } from '../Entitys/CuentasBancarias/CuentaBancaria.entity';
import { EgresoPersonal } from '../Entitys/EgresosPersonales/EgresoPersonal.entity';
import { CreateEmpleadoDto } from '../DTOS/Empleados/Create-Empleado.dto';
import { UpdateEmpleadoDto } from '../DTOS/Empleados/Update-Empleado.dto';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    @InjectRepository(Cargo)
    private readonly cargoRepository: Repository<Cargo>,
    @InjectRepository(CuentaBancaria)
    private readonly cuentaRepository: Repository<CuentaBancaria>,
    @InjectRepository(EgresoPersonal)
    private readonly egresoRepository: Repository<EgresoPersonal>,
  ) {}

  async Validar_Cargo(nombre : string):Promise<Cargo>{
    const existe_cargo = await this.cargoRepository.findOne({where:{nombre:nombre},});
    if(existe_cargo){
      return existe_cargo
    }
    throw new NotFoundException(
      `Este Cargo no esta creado por lo que no se puede hacer la asociacion con el cargo ${nombre}`,
    ); 
  }

  async validar_Empleado(cedula: string):Promise<boolean>{
    const existe_empleado = await this.empleadoRepository.findOne({where:{cedula:cedula}})
    if(existe_empleado){
        return true
    }
    return false
  }

  async Crear_Empleado(nombre: string,createEmpleadoDTO: CreateEmpleadoDto): Promise<Empleado> {
    const existe_cargo = await this.Validar_Cargo(nombre);

    if (await this.validar_Empleado(createEmpleadoDTO.cedula)) {
      throw new ConflictException(
        `Este empleado ya existe: ${createEmpleadoDTO.cedula}`,
      );
    }
    const empleado = new Empleado();
    empleado.nombre = createEmpleadoDTO.nombre;
    empleado.apellido = createEmpleadoDTO.apellido;
    empleado.cedula = createEmpleadoDTO.cedula;
    empleado.cargoId = existe_cargo.id;
    empleado.estado = createEmpleadoDTO.estado || 'ACTIVO';
    empleado.email = createEmpleadoDTO.email?.trim() || undefined;
    empleado.telefono = createEmpleadoDTO.telefono?.trim() || undefined;
    empleado.fechaIngreso = createEmpleadoDTO.fechaIngreso
      ? new Date(createEmpleadoDTO.fechaIngreso)
      : new Date(); // ⬅️ Si no viene, usa HOY
    return await this.empleadoRepository.save(empleado);
  }

    async Obtener_Empleados_Todos() {
      const empleados = await this.empleadoRepository.find({
        relations: { cargo: true },
        order: { nombre: 'ASC' },
      });
      return empleados.map((emp) => ({
        cedula: emp.cedula,
        nombre: emp.nombre,
        apellido: emp.apellido,
        email: emp.email,
        telefono: emp.telefono,
        fechaIngreso: emp.fechaIngreso,
        estado: emp.estado,
        cargo: emp.cargo?.nombre || null,
        sueldo: emp.cargo?.sueldo || null
      }));
    }

    async Obtener_Empleado_ID(cedula:string):Promise<Empleado>{
      const empleado = await this.empleadoRepository.findOne({where:{cedula : cedula},relations:{cargo : true}})
      if(empleado){
        return empleado
      }
      throw new NotFoundException(`Este empleado no existe ${cedula}`);
    }

  async Desactivar_empleado (cedula: string):Promise<Empleado>{
    const empleado = await this.Obtener_Empleado_ID(cedula)
    empleado.estado = "INACTIVO"
    return await this.empleadoRepository.save(empleado)
  }

  async Eliminar_empleado(cedula: string):Promise<Empleado>{
    const empleado = await this.Obtener_Empleado_ID(cedula)
    if(empleado.deletedAt){
      throw new ConflictException(`Este Empleado ya esta Eliminado para visualizar su informacion debe ir a egreso ${empleado.cedula}`); 
    }
    await this.Desactivar_empleado(empleado.cedula)
    await this.empleadoRepository.softDelete(empleado.id)
    empleado.deletedAt = new Date() 
    return empleado
  }

  async Actualizar_Empleado(updateEmpleadoDTO: UpdateEmpleadoDto): Promise<Empleado> {
      // 1. Validar que la cédula venga
      if (!updateEmpleadoDTO.cedula) {
        throw new BadRequestException('La cédula es obligatoria para actualizar');
      }

      // 2. Buscar el empleado (tira 404 si no existe)
      const empleado = await this.Obtener_Empleado_ID(updateEmpleadoDTO.cedula);

      // 3. Actualizar SOLO los campos permitidos (uno por uno)
      if (updateEmpleadoDTO.nombre !== undefined) {
        empleado.nombre = updateEmpleadoDTO.nombre;
      }
      if (updateEmpleadoDTO.apellido !== undefined) {
        empleado.apellido = updateEmpleadoDTO.apellido;
      }
      if (updateEmpleadoDTO.cargoId !== undefined) {
        empleado.cargoId = updateEmpleadoDTO.cargoId;
      }
      if (updateEmpleadoDTO.estado !== undefined) {
        empleado.estado = updateEmpleadoDTO.estado;
      }
      if (updateEmpleadoDTO.email !== undefined) {
        // string vacío → null
        empleado.email = updateEmpleadoDTO.email?.trim() || undefined;
      }
      if (updateEmpleadoDTO.telefono !== undefined) {
        empleado.telefono = updateEmpleadoDTO.telefono?.trim() || undefined;
      }
      if (updateEmpleadoDTO.fechaIngreso !== undefined) {
        // string → Date
        empleado.fechaIngreso = updateEmpleadoDTO.fechaIngreso
          ? new Date(updateEmpleadoDTO.fechaIngreso)
          : undefined;
      }
      return await this.empleadoRepository.save(empleado);
    }
}
