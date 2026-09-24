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
import { HorarioAsistencia } from '../HorariosAsistencia/HorarioAsistencia.entity';

@Entity('asignaciones_horarios')
@Index(['empleadoId', 'fechaInicio', 'fechaFin'])
export class AsignacionHorario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'empleado_id', type: 'uuid', nullable: false })
  empleadoId!: string;

  @Column({ name: 'horario_id', type: 'uuid', nullable: false })
  horarioId!: string;

  @Column({ name: 'fecha_inicio', type: 'date', default: () => 'CURRENT_DATE' })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin?: Date | null;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ============ RELACIONES ============

  @ManyToOne(() => Empleado, (empleado) => empleado.asignacionesHorarios, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'empleado_id' })
  empleado!: Empleado;

  @ManyToOne(() => HorarioAsistencia, (horario) => horario.asignaciones, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'horario_id' })
  horario!: HorarioAsistencia;
}