import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TasaCambio } from '../Tasa_Cambio/Tasas_Cambio.entity';

@Entity('monedas')
export class Moneda {
  @PrimaryGeneratedColumn()
  id!: number;  // ⬅️ number, no string

  @Column({ type: 'varchar', length: 3, unique: true, nullable: false })
  codigo!: string;

  @Column({ type: 'varchar', length: 5, nullable: false })
  simbolo!: string;

  // ⬅️ SE ELIMINARON createdAt y updatedAt (no existen en BD)

  @OneToMany(() => TasaCambio, (tasa) => tasa.moneda)
  tasasCambio!: TasaCambio[];
}