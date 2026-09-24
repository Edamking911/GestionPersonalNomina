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

@Entity('novedades_nomina')
@Index(['cedula', 'fechaInicio', 'fechaFin'])
export class NovedadNomina {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'empleado_id', type: 'uuid' })
  empleadoId!: string;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'empleado_id' })
  empleado!: Empleado;

  @Column({ type: 'varchar', length: 20 })
  cedula!: string;

  @Column({ type: 'varchar', length: 30 })
  tipo!: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin!: Date;

  @Column({ type: 'text', nullable: true })
  motivo!: string | null;

  @Column({ name: 'documento_soporte', type: 'varchar', length: 255, nullable: true })
  documentoSoporte!: string | null;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}