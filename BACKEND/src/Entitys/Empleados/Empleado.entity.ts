import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { CuentaBancaria } from '../CuentasBancarias/CuentaBancaria.entity';
import { EgresoPersonal } from '../EgresosPersonales/EgresoPersonal.entity';

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

  @Column({ type: 'varchar', length: 150, unique: true, nullable: false })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ type: 'date', nullable: false })
  fechaIngreso!: Date;

  @Column({ type: 'uuid', nullable: true })
  cargoId?: string;

  @Column({ type: 'uuid', nullable: true })
  departamentoId?: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVO' })
  estado!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;

  @OneToMany(() => CuentaBancaria, (cuenta) => cuenta.empleado, {
    cascade: true,
  })
  cuentasBancarias!: CuentaBancaria[];

  @OneToMany(() => EgresoPersonal, (egreso) => egreso.empleado, {
    cascade: true,
  })
  egresosPersonales!: EgresoPersonal[];
}
