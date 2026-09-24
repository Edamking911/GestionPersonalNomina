import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NovedadNomina } from '../../Entitys/Novedades/NovedadNomina.entity';
import { Empleado } from '../../Entitys/Empleados/Empleado.entity';
import { CreateNovedadDto } from '../../DTOS/Novedades/CreateNovedad.dto';
import { UpdateNovedadDto } from '../../DTOS/Novedades/UpdateNovedad.dto';
import { ReportesService } from '../Reportes/reportes.service';
import { normalizarCedula } from '../Utils/tiempo.util';

@Injectable()
export class NovedadesService implements OnModuleInit {
  private readonly logger = new Logger(NovedadesService.name);

  // Caché en memoria para no golpear BD en cada evaluación
  private cacheNovedades = new Map<string, NovedadNomina[]>();

  constructor(
    @InjectRepository(NovedadNomina)
    private readonly novedadRepo: Repository<NovedadNomina>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
    @Inject(forwardRef(() => ReportesService))
    private readonly reportes: ReportesService,
  ) {}

  async onModuleInit() {
    await this.cargarCache();
  }

  // =========================================================
  // CARGA MASIVA EN CACHÉ
  // =========================================================
  async cargarCache() {
    const novedades = await this.novedadRepo.find({
      where: { activo: true },
    });

    this.cacheNovedades.clear();
    for (const n of novedades) {
      const cedulaNorm = normalizarCedula(n.cedula);
      if (!this.cacheNovedades.has(cedulaNorm)) {
        this.cacheNovedades.set(cedulaNorm, []);
      }
      this.cacheNovedades.get(cedulaNorm)!.push(n);
    }

    this.logger.log(
      `📅 Caché de novedades cargado: ${novedades.length} registros`,
    );
  }

  // =========================================================
  // BUSCAR NOVEDAD DE UN EMPLEADO EN UNA FECHA
  // ✅ BUG 3 FIX: normaliza la cédula antes de buscar
  // =========================================================
  buscarPorEmpleadoYFecha(cedula: string, fecha: Date): NovedadNomina | null {
    const cedulaNorm = normalizarCedula(cedula);
    const novedades = this.cacheNovedades.get(cedulaNorm) || [];
    const fechaISO = this.aFechaISO(fecha);

    for (const n of novedades) {
      const inicio = this.aFechaISO(n.fechaInicio);
      const fin = this.aFechaISO(n.fechaFin);

      if (fechaISO >= inicio && fechaISO <= fin) {
        return n;
      }
    }

    return null;
  }

  // =========================================================
  // CRUD
  // ✅ BUG 1 FIX: ahora usa desde/hasta
  // ✅ BUG 2 FIX: normaliza cédula del filtro
  // =========================================================
  async listar(
    desde?: string,
    hasta?: string,
    cedula?: string,
    incluirInactivas = false,
  ) {
    const qb = this.novedadRepo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.empleado', 'emp')
      .orderBy('n.fecha_inicio', 'DESC');

    // ✅ Filtro de activas (default)
    if (!incluirInactivas) {
      qb.where('n.activo = true');
    }

    // ✅ BUG 1 FIX: filtro por rango de fechas (solapamiento)
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

    // ✅ BUG 2 FIX: normaliza cédula antes de filtrar
    if (cedula) {
      const cedulaNorm = normalizarCedula(cedula);
      qb.andWhere('n.cedula = :cedula', { cedula: cedulaNorm });
    }

    return await qb.getMany();
  }

  async obtenerPorId(id: string) {
    const novedad = await this.novedadRepo.findOne({
      where: { id },
      relations: { empleado: true },
    });
    if (!novedad) throw new NotFoundException(`Novedad ${id} no encontrada`);
    return novedad;
  }

  // =========================================================
  // ✅ BUG 2 FIX: normaliza la cédula al crear
  // =========================================================
  async crear(dto: CreateNovedadDto) {
    const cedulaNorm = normalizarCedula(dto.employeeId);

    const empleado = await this.empleadoRepo.findOne({
      where: { cedula: cedulaNorm },
    });

    if (!empleado) {
      return {
        success: false,
        message: `Empleado ${dto.employeeId} no encontrado`,
      };
    }

    if (dto.fechaFin < dto.fechaInicio) {
      return {
        success: false,
        message: 'fechaFin no puede ser menor a fechaInicio',
      };
    }

    const nueva = this.novedadRepo.create({
      empleadoId: empleado.id,
      cedula: empleado.cedula,
      tipo: dto.tipo,
      fechaInicio: this.parseFechaLocal(dto.fechaInicio),
      fechaFin: this.parseFechaLocal(dto.fechaFin),
      motivo: dto.motivo || null,
      documentoSoporte: dto.documentoSoporte || null,
      activo: true,
    });

    await this.novedadRepo.save(nueva);

    // Recargar caché + limpiar reportes
    await this.cargarCache();
    this.reportes.limpiarCaches();

    return { success: true, novedad: nueva };
  }

  async actualizar(id: string, dto: UpdateNovedadDto) {
    const novedad = await this.obtenerPorId(id);

    if (dto.tipo) novedad.tipo = dto.tipo;
    if (dto.fechaInicio) {
      novedad.fechaInicio = this.parseFechaLocal(dto.fechaInicio);
    }
    if (dto.fechaFin) {
      novedad.fechaFin = this.parseFechaLocal(dto.fechaFin);
    }
    if (dto.motivo !== undefined) novedad.motivo = dto.motivo || null;
    if (dto.documentoSoporte !== undefined) {
      novedad.documentoSoporte = dto.documentoSoporte || null;
    }

    // Si cambian la cédula, buscamos el nuevo empleado
    if (dto.employeeId) {
      const cedulaNorm = normalizarCedula(dto.employeeId);
      const empleado = await this.empleadoRepo.findOne({
        where: { cedula: cedulaNorm },
      });
      if (empleado) {
        novedad.empleadoId = empleado.id;
        novedad.cedula = empleado.cedula;
      }
    }

    await this.novedadRepo.save(novedad);
    await this.cargarCache();
    this.reportes.limpiarCaches();

    return { success: true, novedad };
  }

  async eliminar(id: string) {
    const novedad = await this.obtenerPorId(id);
    novedad.activo = false;
    await this.novedadRepo.save(novedad);

    await this.cargarCache();
    this.reportes.limpiarCaches();

    return { success: true, message: 'Novedad desactivada' };
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private parseFechaLocal(fechaStr: string): Date {
    const [y, m, d] = fechaStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private aFechaISO(fecha: Date): string {
    const d = new Date(fecha);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
}