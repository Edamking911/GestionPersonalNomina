import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TasaCambio } from '../Tasa_Cambio/Tasas_Cambio.entity';

@Entity('monedas')
export class Moneda {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 3, unique: true, nullable: false })
  codigo!: string;

  @Column({ type: 'varchar', length: 5, nullable: false })
  simbolo!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => TasaCambio, (tasa) => tasa.moneda)
  tasasCambio!: TasaCambio[];
}
