import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empleado } from '../Empleados/Empleado.entity';

@Entity('egresos_personal')  // ✅ Singular, como en la BD
export class EgresoPersonal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'empleado_id', type: 'uuid', nullable: true })
  empleadoId?: string;

  @Column({ name: 'fecha_egreso', type: 'date', nullable: false })
  fechaEgreso!: Date;

  @Column({ type: 'text', nullable: false })
  motivo!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Empleado, (empleado) => empleado.egresosPersonales, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'empleado_id' })
  empleado?: Empleado;
}