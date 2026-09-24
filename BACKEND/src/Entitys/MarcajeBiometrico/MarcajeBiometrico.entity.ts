import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('marcajes_biometrico')
@Index(['cedula', 'fechaHora', 'origen'], { unique: true })
@Index(['cedula'])
@Index(['fechaHora'])
export class MarcajeBiometrico {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  cedula!: string;

  @Column({ name: 'fecha_hora', type: 'timestamptz', nullable: false })
  fechaHora!: Date;

  @Column({ name: 'dispositivo_id', type: 'varchar', length: 50, nullable: true })
  dispositivoId?: string | null;

  @Column({
    name: 'tipo_marcaje',
    type: 'varchar',
    length: 30,
    default: 'HUELLA',
    nullable: false,
  })
  tipoMarcaje!: string;

  @Column({
    name: 'nombre_empleado_cache',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  nombreEmpleadoCache?: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'BIOMETRICO',
    nullable: false,
  })
  origen!: 'BIOMETRICO' | 'MANUAL';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}