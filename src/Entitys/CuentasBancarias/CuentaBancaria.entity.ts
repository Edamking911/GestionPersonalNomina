import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import * as crypto from 'crypto';
import { Empleado } from '../Empleados/Empleado.entity';

export class CuentaBancariaTransformer {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly key = Buffer.from(
    process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
    'hex',
  );

  static to(value: string): string {
    if (!value) return value;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return (
      iv.toString('hex') +
      ':' +
      authTag.toString('hex') +
      ':' +
      encrypted.toString('hex')
    );
  }

  static from(value: string): string {
    if (!value) return value;
    const parts = value.split(':');
    if (parts.length !== 3) return value;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }
}

@Entity('cuentas_bancarias')
@Index(['empleadoId', 'esPrincipal'], {
  unique: true,
  where: '"esPrincipal" = true',
})
export class CuentaBancaria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'empleado_id', type: 'uuid', nullable: false })
  empleadoId!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  banco!: string;

  @Column({
    name: 'numero_cuenta_encrypted',
    type: 'text',
    nullable: false,
    transformer: CuentaBancariaTransformer,
  })
  numeroCuentaEncrypted!: string;

  @Column({ name: 'es_principal', type: 'boolean', default: false })
  esPrincipal!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Empleado, (empleado) => empleado.cuentasBancarias, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empleado_id' })
  empleado!: Empleado;
}
