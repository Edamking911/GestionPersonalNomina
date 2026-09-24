import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NovedadNomina } from '../../Entitys/Novedades/NovedadNomina.entity';
import { Empleado } from '../../Entitys/Empleados/Empleado.entity';
import { normalizarCedula } from '../Utils/tiempo.util';

@Injectable()
export class NovedadesReporteService {
  constructor(
    @InjectRepository(NovedadNomina)
    private readonly novedadRepo: Repository<NovedadNomina>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  // =========================================================
  // REPORTE POR EMPLEADO
  // =========================================================
  async reportePorEmpleado(cedula: string, desde?: string, hasta?: string) {
    const cedulaNorm = normalizarCedula(cedula);

    const empleado = await this.empleadoRepo
      .createQueryBuilder('e')
      .where('e.cedula = :cedula', { cedula: cedulaNorm })
      .getOne();

    if (!empleado) {
      throw new NotFoundException(`Empleado ${cedula} no encontrado`);
    }

    const qb = this.novedadRepo
      .createQueryBuilder('n')
      .where('n.cedula = :cedula', { cedula: cedulaNorm })
      .andWhere('n.activo = true')
      .orderBy('n.fecha_inicio', 'DESC');

    if (desde && hasta) {
      qb.andWhere('(n.fecha_inicio <= :hasta AND n.fecha_fin >= :desde)', {
        desde,
        hasta,
      });
    } else if (desde) {
      qb.andWhere('n.fecha_fin >= :desde', { desde });
    } else if (hasta) {
      qb.andWhere('n.fecha_inicio <= :hasta', { hasta });
    }

    const novedades = await qb.getMany();

    const contadores = this.crearContadoresVacios();
    let totalDias = 0;

    for (const n of novedades) {
      const dias = this.contarDias(n.fechaInicio, n.fechaFin);
      totalDias += dias;
      if (contadores[n.tipo] !== undefined) {
        contadores[n.tipo] += dias;
      }
    }

    return {
      success: true,
      empleado: {
        cedula: empleado.cedula,
        nombre: `${empleado.nombre} ${empleado.apellido}`.trim(),
        estado: empleado.estado,
      },
      rango: {
        desde: desde || 'sin límite',
        hasta: hasta || 'sin límite',
      },
      resumen: {
        totalNovedades: novedades.length,
        totalDias,
        ...contadores,
      },
      novedades: novedades.map((n) => ({
        id: n.id,
        tipo: n.tipo,
        tipoLegible: this.tipoLegible(n.tipo),
        fechaInicio: this.formatearFecha(n.fechaInicio),
        fechaFin: this.formatearFecha(n.fechaFin),
        dias: this.contarDias(n.fechaInicio, n.fechaFin),
        motivo: n.motivo,
        documento: n.documentoSoporte,
        activo: n.activo,
        creadoEl: n.createdAt,
      })),
    };
  }

  // =========================================================
  // RESUMEN MENSUAL POR EMPLEADO
  // =========================================================
  async resumenMensual(cedula: string, mes?: string) {
    let año: number;
    let mesNum: number;

    if (mes) {
      const [y, m] = mes.split('-').map(Number);
      año = y;
      mesNum = m - 1;
    } else {
      const hoy = new Date();
      año = hoy.getFullYear();
      mesNum = hoy.getMonth();
    }

    const desde = new Date(año, mesNum, 1);
    const hasta = new Date(año, mesNum + 1, 0);

    const desdeStr = this.formatearFechaISO(desde);
    const hastaStr = this.formatearFechaISO(hasta);

    return await this.reportePorEmpleado(cedula, desdeStr, hastaStr);
  }

  // =========================================================
  // ESTADÍSTICAS GLOBALES
  // =========================================================
  async estadisticasGlobales(desde?: string, hasta?: string) {
    const qb = this.novedadRepo
      .createQueryBuilder('n')
      .where('n.activo = true')
      .orderBy('n.fecha_inicio', 'DESC');

    if (desde && hasta) {
      qb.andWhere('(n.fecha_inicio <= :hasta AND n.fecha_fin >= :desde)', {
        desde,
        hasta,
      });
    }

    const novedades = await qb.getMany();

    const porTipo: Record<string, { cantidad: number; dias: number }> = {};
    const porEmpleado: Record<string, { cedula: string; nombre: string; dias: number; novedades: number }> = {};

    for (const n of novedades) {
      const dias = this.contarDias(n.fechaInicio, n.fechaFin);

      if (!porTipo[n.tipo]) porTipo[n.tipo] = { cantidad: 0, dias: 0 };
      porTipo[n.tipo].cantidad++;
      porTipo[n.tipo].dias += dias;

      if (!porEmpleado[n.cedula]) {
        porEmpleado[n.cedula] = { cedula: n.cedula, nombre: n.cedula, dias: 0, novedades: 0 };
      }
      porEmpleado[n.cedula].dias += dias;
      porEmpleado[n.cedula].novedades++;
    }

    // Enriquecer con nombres
    const cedulas = Object.keys(porEmpleado);
    if (cedulas.length > 0) {
      const empleados = await this.empleadoRepo
        .createQueryBuilder('e')
        .where('e.cedula IN (:...cedulas)', { cedulas })
        .getMany();

      for (const e of empleados) {
        if (porEmpleado[e.cedula]) {
          porEmpleado[e.cedula].nombre = `${e.nombre} ${e.apellido}`.trim();
        }
      }
    }

    return {
      success: true,
      rango: {
        desde: desde || 'sin límite',
        hasta: hasta || 'sin límite',
      },
      totales: {
        novedades: novedades.length,
        dias: Object.values(porTipo).reduce((s, v) => s + v.dias, 0),
        empleadosAfectados: Object.keys(porEmpleado).length,
      },
      porTipo: Object.entries(porTipo)
        .map(([tipo, data]) => ({
          tipo,
          tipoLegible: this.tipoLegible(tipo),
          ...data,
        }))
        .sort((a, b) => b.dias - a.dias),
      porEmpleado: Object.values(porEmpleado)
        .sort((a, b) => b.dias - a.dias),
    };
  }

  // =========================================================
  // HELPERS
  // =========================================================
  private crearContadoresVacios() {
    return {
      VACACIONES: 0,
      REPOSO_MEDICO: 0,
      PERMISO_REMUNERADO: 0,
      PERMISO_NO_REMUNERADO: 0,
      FALTA_JUSTIFICADA: 0,
      FALTA_INJUSTIFICADA: 0,
    };
  }

  private contarDias(inicio: Date, fin: Date): number {
    const i = new Date(inicio);
    const f = new Date(fin);
    const diff = Math.floor((f.getTime() - i.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  }

  private formatearFecha(fecha: Date): string {
    const d = new Date(fecha);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${dd}/${m}/${y}`;
  }

  private formatearFechaISO(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private tipoLegible(tipo: string): string {
    const mapa: Record<string, string> = {
      VACACIONES: 'Vacaciones',
      REPOSO_MEDICO: 'Reposo Médico',
      PERMISO_REMUNERADO: 'Permiso Remunerado',
      PERMISO_NO_REMUNERADO: 'Permiso No Remunerado',
      FALTA_JUSTIFICADA: 'Falta Justificada',
      FALTA_INJUSTIFICADA: 'Falta Injustificada',
    };
    return mapa[tipo] || tipo;
  }
}