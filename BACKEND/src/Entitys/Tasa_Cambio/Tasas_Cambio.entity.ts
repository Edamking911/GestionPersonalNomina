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

  @Column({ name: 'moneda_id', type: 'int', nullable: true })
  monedaId?: number;

  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: false })
  tasa!: number;

  @CreateDateColumn({ name: 'fecha_efectiva', type: 'timestamptz' })
  fechaEfectiva!: Date;

  // ⬅️ SE ELIMINÓ createdAt (no existe en BD)

  @ManyToOne(() => Moneda, (moneda) => moneda.tasasCambio, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'moneda_id' })
  moneda?: Moneda;
}