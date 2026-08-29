import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import {TasaCambio} from '../Entitys/Tasa_Cambio/Tasas_Cambio.entity'
import { CreateTasaCambioDto } from 'src/DTOS/Tasa_Cambio/Create-TasaCambio.dto';
import {UpdateTasaCambioDto} from 'src/DTOS/Tasa_Cambio/Update-TasaCambio.dto'

@Injectable()
export class TasaCambioService {
    constructor(@InjectRepository(TasaCambio) private Tasacambio: Repository<TasaCambio>){}
}
