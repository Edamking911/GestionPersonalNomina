import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Departamento } from '../Entitys/Departamentos/Departamentos.entity';
import { Cargo } from '../Entitys/Cargos/Cargos.entity';
import { CreateCargoDto } from '../DTOS/Cargos/Create-Cargos.dto';
import { UpdateCargoDto } from '../DTOS/Cargos/Update-Cargos.dto';

@Injectable()
export class CargosService {
  constructor(
    @InjectRepository(Cargo) private CargoRepository: Repository<Cargo>,
    @InjectRepository(Departamento)
    private DepertamentoRepository: Repository<Departamento>,
  ) {}

  async Validar_Departamento(nombre: string): Promise<Departamento> {
    const ExisteDepa = await this.DepertamentoRepository.findOne({
      where: { nombre: ILike(`%${nombre}%`) },
    });
    if (ExisteDepa) {
      return ExisteDepa;
    }
    throw new NotFoundException(
      `Este Departamento no esta creado por lo que no se puede hacer la asociacion con el cargo ${nombre}`,
    );
  }

  async Validar_Cargo(nombre: string): Promise<boolean> {
    const existeCargo = await this.CargoRepository.findOne({
      where: { nombre: nombre },
    });
    if (existeCargo) {
        throw new NotFoundException(
        `Este Cargo ya esta Creado ${nombre}`,
      );
    }
    return false;
  }

  async Create_Cargo(nombre: string,CreateCargoDTO: CreateCargoDto): Promise<Cargo> {
    const existeDepa = await this.Validar_Departamento(nombre);
    if (existeDepa) {
      const crear = new Cargo();
      crear.nombre = CreateCargoDTO.nombre;
      crear.sueldo = CreateCargoDTO.sueldo;
      crear.departamentoId = existeDepa.id;
      return await this.CargoRepository.save(crear);
      
    }
    throw new NotFoundException(`Error al Procesar La Solicitud`);
  }

  async Traer_Cargos(){
    const Existe_cargo = await this.CargoRepository.find({relations:{departamento:true},order:{nombre:'ASC'}});
    return Existe_cargo.map ((carg) => ({
        nombre : carg.nombre,
        sueldo : carg.sueldo,
        nombreDepa : carg.departamento?.nombre
      }));
  }

  async Obtener_CargoEspecifico(nombre: string): Promise<Cargo> {
    const existeCargo = await this.CargoRepository.findOne({
      where: { nombre: ILike(`%${nombre}%`)}, relations:{departamento: true}});
    if (existeCargo) {
      return existeCargo;
    } else {
      throw new NotFoundException(`Este Cargo no existe${nombre}`);
    }
  }

  async Eliminar_cargo(nombre: string): Promise<Cargo> {
    return await this.CargoRepository.remove(
      await this.Obtener_CargoEspecifico(nombre),
    );
  }

  async Actualizar_Cargo(UpdateCargoDTO: UpdateCargoDto,): Promise<Cargo> {
    if(UpdateCargoDTO.nombre){
      throw new BadRequestException('El cargo es obligatoria para actualizar');
    }
    const Existe_cargo = await this.Obtener_CargoEspecifico(UpdateCargoDTO.nombre!)

    if(UpdateCargoDTO.nombre !== undefined){
      Existe_cargo.nombre = UpdateCargoDTO.nombre
    }

    if(UpdateCargoDTO.sueldo !== undefined){
      Existe_cargo.sueldo = UpdateCargoDTO.sueldo
    } 

    return await this.CargoRepository.save(Existe_cargo)
  }
}
