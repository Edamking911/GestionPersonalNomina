import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empleado } from '../Empleados/Empleado.entity';

@Entity('historicos_salarios')
export class HistoricoSalario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'empleado_id', type: 'uuid', nullable: false })
  empleadoId!: string;

  @Column({
    name: 'monto_sueldo',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  montoSueldo!: number;

  @Column({ name: 'moneda_id', type: 'uuid', nullable: false })
  monedaId!: string;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: false })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Empleado, (empleado) => empleado.historicoSalarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empleado_id' })
  empleado!: Empleado;
}
