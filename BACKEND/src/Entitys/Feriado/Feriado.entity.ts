import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('feriados')
@Index(['pais', 'fecha'])
export class Feriado {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date', unique: true, nullable: false })
  fecha!: Date;

  @Column({ type: 'varchar', length: 150, nullable: false })
  nombre!: string;

  @Column({ type: 'varchar', length: 10, default: 'VE', nullable: false })
  pais!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}