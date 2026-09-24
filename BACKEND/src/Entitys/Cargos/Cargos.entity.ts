import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Departamento } from '../Departamentos/Departamentos.entity';
import { Empleado } from '../Empleados/Empleado.entity';

@Entity('cargos')
export class Cargo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'departamento_id', type: 'uuid', nullable: true })
  departamentoId?: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre!: string;

  @Column({type: 'numeric',precision: 12,scale: 2,nullable: false,default: 0,transformer: {
      to: (value: number) => value,              // Al guardar → number
      from: (value: string) => parseFloat(value), // Al leer → number
    },
  })
  sueldo!: number;
  
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Departamento, (dep) => dep.cargos, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'departamento_id' })
  departamento?: Departamento;

  @OneToMany(() => Empleado, (empleado) => empleado.cargo)
  empleados!: Empleado[];
}