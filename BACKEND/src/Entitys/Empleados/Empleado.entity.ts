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
import { HistoricoSalario } from '../HistoricosSalarios/HistoricoSalario.entity';
import { Cargo } from '../Cargos/Cargos.entity';
import { Departamento } from '../Departamentos/Departamentos.entity';

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

  @Column({ name: 'cargo_id', type: 'uuid', nullable: true })
  cargoId?: string;

  @Column({ name: 'departamento_id', type: 'uuid', nullable: true })
  departamentoId?: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVO' })
  estado!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;

  @ManyToOne(() => Cargo, { nullable: true })
  @JoinColumn({ name: 'cargo_id' })
  cargo!: Cargo;

  @ManyToOne(() => Departamento, { nullable: true })
  @JoinColumn({ name: 'departamento_id' })
  departamento!: Departamento;

  @OneToMany(() => CuentaBancaria, (cuenta) => cuenta.empleado, {
    cascade: true,
  })
  cuentasBancarias!: CuentaBancaria[];

  @OneToMany(() => EgresoPersonal, (egreso) => egreso.empleado, {
    cascade: true,
  })
  egresosPersonales!: EgresoPersonal[];

  @OneToMany(() => HistoricoSalario, (historial) => historial.empleado, {
    cascade: true,
  })
  historicoSalarios!: HistoricoSalario[];
}
