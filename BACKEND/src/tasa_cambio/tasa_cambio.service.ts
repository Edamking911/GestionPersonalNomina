import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { TasaCambio } from '../Entitys/Tasa_Cambio/Tasas_Cambio.entity';
import { Moneda } from 'src/Entitys/Moneda/Moneda.entity';
import { CreateTasaCambioDto } from 'src/DTOS/Tasa_Cambio/Create-TasaCambio.dto';
import { UpdateTasaCambioDto } from 'src/DTOS/Tasa_Cambio/Update-TasaCambio.dto';

@Injectable()
export class TasaCambioService {
  constructor(
    @InjectRepository(TasaCambio)
    private TasacambioRepository: Repository<TasaCambio>,
    @InjectRepository(Moneda) private Mone: Repository<Moneda>,
  ) {}

  async Validar_Moneda(codigo: string): Promise<Moneda> {
    const moneda = await this.Mone.findOne({ where: { codigo: codigo } });
    if (moneda) {
      return moneda;
    }
    throw new NotFoundException(
      `Este Codigo Tributario no se encuentra creado ${codigo}`,
    );
  }

  async Crear_Tasa(
    codigo: string,
    createDToTasa: CreateTasaCambioDto,
  ): Promise<TasaCambio> {
    const moneda = await this.Validar_Moneda(codigo);
    if (moneda) {
      const crear = new TasaCambio();
      crear.monedaId = moneda.id;
      crear.tasa = createDToTasa.tasa;
      return await this.TasacambioRepository.save(crear);
    }
    throw new NotFoundException(`Error al Procesar al Procesar La solicitud`);
  }

  async Traer_Tasas(): Promise<TasaCambio[]> {
    return await this.TasacambioRepository.find();
  }

  async Obtener_Tasa(tasa: number): Promise<TasaCambio> {
    const Tasa = await this.TasacambioRepository.findOne({
      where: { tasa: tasa },
    });
    if (Tasa) {
      return Tasa;
    }
    throw new NotFoundException(`Error al buscar la tasa o No fue Creada`);
  }

  async Eliminar_Registro(tasa: number): Promise<TasaCambio> {
    return await this.Obtener_Tasa(tasa);
  }

  async Actualizar_Tasa(
    tasa: number,
    updateDTOTasa: UpdateTasaCambioDto,
  ): Promise<TasaCambio> {
    const Tasa = await this.Obtener_Tasa(tasa);
    Object.assign(Tasa, updateDTOTasa);
    return await this.TasacambioRepository.save(Tasa);
  }
}
