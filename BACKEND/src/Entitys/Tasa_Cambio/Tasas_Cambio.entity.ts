import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Moneda } from '../Moneda/Moneda.entity';

@Entity('tasas_cambio')
export class TasaCambio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'moneda_id', type: 'uuid', nullable: false })
  monedaId!: string;

  @Column({ type: 'numeric', precision: 18, scale: 4, nullable: false })
  tasa!: number;

  @CreateDateColumn({ name: 'fecha_efectiva', type: 'timestamptz' })
  fechaEfectiva!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Moneda, (moneda) => moneda.tasasCambio, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'moneda_id' })
  moneda!: Moneda;
}
