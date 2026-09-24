import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AsignacionHorario } from '../AsignacionHorario/AsignacionHorario.entity';

@Entity('horarios_asistencia')
export class HorarioAsistencia {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo!: string;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ name: 'hora_entrada', type: 'time' })
  horaEntrada!: string;

  @Column({ name: 'hora_salida', type: 'time' })
  horaSalida!: string;

  @Column({ name: 'tolerancia_min', type: 'int', default: 10 })
  toleranciaMin!: number;

  // ⬇️ NUEVOS
  @Column({ name: 'break_duracion_min', type: 'int', default: 60 })
  breakDuracionMin!: number;

  @Column({ name: 'break_tolerancia_min', type: 'int', default: 5 })
  breakToleranciaMin!: number;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

   @OneToMany(() => AsignacionHorario, (asig) => asig.horario)
  asignaciones!: AsignacionHorario[];
}