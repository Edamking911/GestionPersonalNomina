import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Departamento } from '../Departamentos/Departamentos.entity';
// (Aquí después importarás la entidad Empleado cuando la hagamos)
// import { Empleado } from '../empleados/empleado.entity';

@Entity('cargos')
export class Cargo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'departamento_id', type: 'uuid', nullable: false })
  departamentoId!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relación N:1 con Departamento
  @ManyToOne(() => Departamento, (departamento) => departamento.cargos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'departamento_id' })
  departamento!: Departamento;

  // Relación 1:N con Empleados (para cuando hagamos la de empleados)
  // @OneToMany(() => Empleado, (empleado) => empleado.cargo)
  // empleados: Empleado[];
}
