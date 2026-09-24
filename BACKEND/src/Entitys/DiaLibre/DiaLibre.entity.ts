import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Empleado } from '../Empleados/Empleado.entity';

@Entity('dias_libres')
@Check(`"dia_semana" BETWEEN 0 AND 6`)
@Check(
  `("tipo" = 'FIJO' AND "semana_inicio" IS NULL) OR ("tipo" = 'ROTATIVO' AND "semana_inicio" IS NOT NULL)`,
)
@Index(['empleadoId', 'tipo', 'diaSemana', 'semanaInicio'], { unique: true })
export class DiaLibre {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'empleado_id', type: 'uuid', nullable: false })
  empleadoId!: string;

  @Column({ type: 'varchar', length: 20, default: 'FIJO' })
  tipo!: 'FIJO' | 'ROTATIVO';

  @Column({ name: 'dia_semana', type: 'smallint', nullable: false })
  diaSemana!: number;

  @Column({ name: 'semana_inicio', type: 'date', nullable: true })
  semanaInicio?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Empleado, (empleado) => empleado.diasLibres, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'empleado_id' })
  empleado!: Empleado;
}