import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CuentaBancaria } from '../CuentasBancarias/CuentaBancaria.entity';
import { EgresoPersonal } from '../EgresosPersonales/EgresoPersonal.entity';
import { Cargo } from '../Cargos/Cargos.entity';
import { DiaLibre } from '../DiaLibre/DiaLibre.entity';
import { AsignacionHorario } from '../AsignacionHorario/AsignacionHorario.entity';
import {NovedadNomina} from '../Novedades/NovedadNomina.entity'

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  cedula!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  apellido!: string;

  @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ name: 'fecha_ingreso', type: 'date', nullable: true })
  fechaIngreso?: Date;

  @Column({ name: 'cargo_id', type: 'uuid', nullable: true })
  cargoId?: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVO' })
  estado!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;

   @ManyToOne(() => Cargo, (cargo) => cargo.empleados, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'cargo_id' })
  cargo?: Cargo;

  @OneToMany(() => CuentaBancaria, (cuenta) => cuenta.empleado)
  cuentasBancarias!: CuentaBancaria[];

  @OneToMany(() => EgresoPersonal, (egreso) => egreso.empleado)
  egresosPersonales!: EgresoPersonal[];

  @OneToMany(() => DiaLibre, (dia) => dia.empleado)
  diasLibres!: DiaLibre[];

  @OneToMany(() => AsignacionHorario, (asig) => asig.empleado)
  asignacionesHorarios!: AsignacionHorario[];


  @OneToMany(() => NovedadNomina, (novedad) => novedad.empleado)
  novedades!: NovedadNomina[];
}