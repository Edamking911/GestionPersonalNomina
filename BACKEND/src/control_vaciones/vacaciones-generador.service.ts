import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';
import { ControlVacaciones } from '../Entitys/Control_Vacaciones/ControlVacaciones.entity';

@Injectable()
export class VacacionesGeneradorService implements OnModuleInit {
  private readonly logger = new Logger(VacacionesGeneradorService.name);

  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
    @InjectRepository(ControlVacaciones)
    private readonly controlVacRepo: Repository<ControlVacaciones>,
  ) {}

  async onModuleInit() {
    // Ejecutar 5 segundos después del arranque
    setTimeout(() => {
      this.generarVacacionesAnuales().catch((e) =>
        this.logger.error(`Error generación inicial: ${e.message}`),
      );
    }, 5000);
  }

  // =========================================================
  // CRON: TODOS LOS DÍAS A LAS 00:00
  // =========================================================
  @Cron('0 0 * * *')
  async cronGenerarVacaciones() {
    this.logger.log('Cron: generando vacaciones del año en curso...');
    await this.generarVacacionesAnuales();
  }

  // =========================================================
  // GENERAR VACACIONES POR ANTIGÜEDAD
  // =========================================================
  async generarVacacionesAnuales() {
    const anioActual = new Date().getFullYear();

    const empleados = await this.empleadoRepo
      .createQueryBuilder('e')
      .where('e.estado = :estado', { estado: 'ACTIVO' })
      .andWhere('e.fecha_ingreso IS NOT NULL')
      .andWhere('e.deleted_at IS NULL')
      .getMany();

    let generados = 0;
    let omitidos = 0;
    const detalles: any[] = [];

    for (const emp of empleados) {
      const fechaIngreso = new Date(emp.fechaIngreso!);
      const aniosServicio = this.calcularAniosServicio(fechaIngreso, anioActual);

      // Requiere al menos 1 año cumplido
      if (aniosServicio < 1) {
        omitidos++;
        continue;
      }

      // Fórmula LOTTT art. 190: 15 días + 1 por año adicional (máx 30)
      const diasDerecho = Math.min(15 + (aniosServicio - 1), 30);

      // Verificar si ya existe el período
      const existe = await this.controlVacRepo.findOne({
        where: { empleadoId: emp.id, periodoAno: anioActual },
      });

      if (existe) {
        omitidos++;
        continue;
      }

      const nuevo = this.controlVacRepo.create({
        empleadoId: emp.id,
        periodoAno: anioActual,
        diasDisfruteDerecho: diasDerecho,
        diasBonoDerecho: diasDerecho,
        diasDisfrutados: 0,
        diasBonoPagados: 0,
        estado: 'PENDIENTE',
      });

      await this.controlVacRepo.save(nuevo);
      generados++;

      detalles.push({
        cedula: emp.cedula,
        nombre: `${emp.nombre} ${emp.apellido}`,
        aniosServicio,
        diasOtorgados: diasDerecho,
      });
    }

    this.logger.log(
      `Vacaciones ${anioActual}: ${generados} generados, ${omitidos} omitidos`,
    );

    return {
      success: true,
      anio: anioActual,
      empleadosProcesados: empleados.length,
      generados,
      omitidos,
      detalles,
    };
  }

  private calcularAniosServicio(fechaIngreso: Date, anioActual: number): number {
    // Años cumplidos hasta HOY
    const hoy = new Date();
    let anios = anioActual - fechaIngreso.getFullYear();

    // Ajustar si aún no cumplió el aniversario este año
    const aniversarioEsteAnio = new Date(
      anioActual,
      fechaIngreso.getMonth(),
      fechaIngreso.getDate(),
    );

    if (aniversarioEsteAnio > hoy) {
      anios--;
    }

    return Math.max(0, anios);
  }
}