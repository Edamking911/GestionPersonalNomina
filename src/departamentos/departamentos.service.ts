import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import {CreateDepartamentoDto} from '../DTOS/Departamentos/Create-Departamento.dto'
import {UpdateDepartamentoDto} from '../DTOS/Departamentos/Update-Departamento.dto'
import {Departamento} from '../Entitys/Departamentos/Departamentos.entity'

@Injectable()
export class DepartamentosService {
    constructor(@InjectRepository(Departamento) private departamento : Repository<Departamento>){}

        //Funcion que se encarga de validar si el departamento existe es funcion Booleana
    async ValidarDepartamento(nombre : string): Promise <boolean>{
        const departamento = await this.departamento.findOne({where:{nombre:nombre}})
        if(departamento){
            return true;
        }
        return false
    }

    // Esta Funcion se encarga de crear un departamento
    async Crear_Departamento(createDTO : CreateDepartamentoDto): Promise<Departamento>{
        const existe = await this.ValidarDepartamento(createDTO.nombre);
        if(existe){
            throw new NotFoundException(`Este Departamento ya ha Sido Creado ${createDTO.nombre}`)
        }
        else{
            const crear = new Departamento() //Creo una variable de tipo Departamento
            crear.nombre = createDTO.nombre
            crear.codigo = createDTO.codigo
            return this.departamento.save(crear)
        }
         
    }

    //Traigo Todos los departamentos Registrados
    async Traer_Departamentos(): Promise<Departamento[]>{
        return this.departamento.find()
    }

    // Busco Un departamento en especifico
    async Buscar_Departamento(nombre:string): Promise<Departamento>{
        const existe = await this.departamento.findOne({where:{nombre:ILike(`%${nombre}%`)}})
        if(existe){
            return existe
        }
        else{
             throw new NotFoundException(`Este Departamento no ha sido registrado ${nombre}`)
        }
    }

    // Elimino un Departamento en Especifico
    async Eliminar_Departamento(nombre: string): Promise<Departamento>{
        return await this.departamento.remove(await this.Buscar_Departamento(nombre))
    }


    async Actualizar_Departamento(nombre : string,UpdateDTO : UpdateDepartamentoDto): Promise<Departamento>{
        const actualizarDepa = await this.Buscar_Departamento(nombre)
        Object.assign(actualizarDepa,UpdateDTO)
        if(actualizarDepa){
            const update = await this.departamento.save(actualizarDepa)
            return this.Buscar_Departamento(update.nombre)
        }
        else{
            throw new NotFoundException(`Este Departamento no ha sido registrado ${nombre}`)
        }
        
    }

}
