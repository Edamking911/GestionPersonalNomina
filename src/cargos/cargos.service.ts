import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Departamento } from 'src/Entitys/Departamentos/Departamentos.entity';
import { Cargo } from 'src/Entitys/Cargos/Cargos.entity';
import { CreateCargoDto } from 'src/DTOS/Cargos/Create-Cargos.dto';
import { UpdateCargoDto } from 'src/DTOS/Cargos/Update-Cargos.dto';
import { DepartamentosService } from 'src/departamentos/departamentos.service';

@Injectable()
export class CargosService {
    constructor(@InjectRepository(Cargo) private CargoRepository : Repository<Cargo>,
        @InjectRepository(Departamento) private DepertamentoRepository : Repository<Departamento>
    ){}

    async Validar_Departamento(nombre : string): Promise<Departamento>{
        const ExisteDepa = await this.DepertamentoRepository.findOne({where:{nombre:ILike(`%${nombre}%`)}})
        if(ExisteDepa){
            return ExisteDepa
        }
        throw new NotFoundException(`Este Departamento no esta creado por lo que no se puede hacer la asociacion con el cargo ${nombre}`)
    }


    async Validar_Cargo(nombre: string): Promise<boolean>{
        const existeCargo = await this.CargoRepository.findOne({where:{nombre:nombre}})
        if(existeCargo){
            return true
        }
        return false
    }

    async Create_Cargo(nombre: string,CreateCargoDTO: CreateCargoDto): Promise<Cargo>{
        const existeDepa = await this.Validar_Departamento(nombre);
        if(existeDepa){
            const existeCargo = await this.Validar_Cargo(CreateCargoDTO.nombre);
            if(existeCargo){
                throw new NotFoundException(`Este Cargo ya ha Sido Creado ${CreateCargoDTO.nombre}`)
            }
            else{
                const crear = new Cargo()
                crear.nombre = CreateCargoDTO.nombre
                crear.departamentoId = existeDepa.id
                return await this.CargoRepository.save(crear)
            }
        }
        throw new NotFoundException(`Error al Procesar La Solicitud`)
    }

    async Traer_Cargos(): Promise<Cargo[]>{
        return await this.CargoRepository.find()
    }

    async Obtener_CargoEspecifico(nombre: string): Promise<Cargo>{
        const existeCargo = await this.CargoRepository.findOne({where:{nombre:ILike(`%${nombre}%`)}});
        if(existeCargo){
            return existeCargo
        }
        else{
            throw new NotFoundException(`Este Cargo no existe${nombre}`)
        }
    }

    async Eliminar_cargo(nombre: string): Promise<Cargo>{
        return await this.CargoRepository.remove(await this.Obtener_CargoEspecifico(nombre))
    }

    async Actualizar_Cargo(nombre: string, UpdateCargoDTO : UpdateCargoDto): Promise<Cargo>{
        const existeCargo = await this.Obtener_CargoEspecifico(nombre);
        Object.assign(existeCargo,UpdateCargoDTO)
        return await this.CargoRepository.save(existeCargo)
    }
}
