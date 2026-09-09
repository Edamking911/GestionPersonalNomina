import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Moneda } from 'src/Entitys/Moneda/Moneda.entity';
import { CreateMonedaDto } from 'src/DTOS/Moneda/Create-Moneda.dto';
import { UpdateMonedaDto } from 'src/DTOS/Moneda/Update-Moneda.dto';
@Injectable()
export class MonedaService {
  constructor(
    @InjectRepository(Moneda) private monedaRepository: Repository<Moneda>,
  ) {}

  async Validar_Moneda(codigo: string): Promise<boolean> {
    const moneda = await this.monedaRepository.findOne({
      where: { codigo: ILike(`%${codigo}%`) },
    });
    if (moneda) {
      return true;
    }

    return false;
  }

  async Crear_Moneda(CreatemonedaDto: CreateMonedaDto): Promise<Moneda> {
    const moneda = await this.Validar_Moneda(CreatemonedaDto.codigo);
    if (moneda) {
      throw new NotFoundException(
        `Este Codigo Tributario ya esta Creado ${CreatemonedaDto.codigo}`,
      );
    }
    const crear = new Moneda();
    crear.codigo = CreatemonedaDto.codigo;
    crear.simbolo = CreatemonedaDto.simbolo;
    return await this.monedaRepository.save(crear);
  }

  async Traer_Monedas(): Promise<Moneda[]> {
    return await this.monedaRepository.find();
  }

  async Obtener_Moneda(codigo: string): Promise<Moneda> {
    const moneda = await this.monedaRepository.findOne({
      where: { codigo: ILike(`%${codigo}%`) },
    });
    if (moneda) {
      return moneda;
    }
    throw new NotFoundException(
      `Este Codigo Tributario No esta Creado ${codigo}`,
    );
  }

  async Eliminar_Moneda(codigo: string): Promise<Moneda> {
    return await this.monedaRepository.remove(
      await this.Obtener_Moneda(codigo),
    );
  }

  async Actualizar_Moneda(
    codigo: string,
    updatemoneda: UpdateMonedaDto,
  ): Promise<Moneda> {
    const moneda = await this.Obtener_Moneda(codigo);
    Object.assign(moneda, updatemoneda);
    return await this.monedaRepository.save(moneda);
  }
}
