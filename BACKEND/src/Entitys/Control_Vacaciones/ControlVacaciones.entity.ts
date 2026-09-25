import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Empleado } from '../Empleados/Empleado.entity';

@Entity('control_vacaciones')
@Index(['empleadoId', 'periodoAno'], { unique: true })
export class ControlVacaciones {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'empleado_id', type: 'uuid' })
  empleadoId!: string;

  @ManyToOne(() => Empleado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empleado_id' })
  empleado?: Empleado;

  @Column({ name: 'periodo_ano', type: 'int' })
  periodoAno!: number;

  @Column({ name: 'dias_disfrute_derecho', type: 'int' })
  diasDisfruteDerecho!: number;

  @Column({ name: 'dias_bono_derecho', type: 'int' })
  diasBonoDerecho!: number;

  @Column({ name: 'dias_disfrutados', type: 'int', default: 0 })
  diasDisfrutados!: number;

  @Column({ name: 'dias_bono_pagados', type: 'int', default: 0 })
  diasBonoPagados!: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado!: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}