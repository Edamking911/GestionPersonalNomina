import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Empleado } from '../../Entitys/Empleados/Empleado.entity';
import { HorarioAsistencia as HorarioEntity } from '../../Entitys/HorariosAsistencia/HorarioAsistencia.entity';
import { AsignacionHorario } from '../../Entitys/AsignacionHorario/AsignacionHorario.entity';
import { DiaLibre } from '../../Entitys/DiaLibre/DiaLibre.entity';
import { normalizarCedula, nombreADia } from '../Utils/tiempo.util';

@Injectable()
export class MigracionJsonService {
  private readonly logger = new Logger(MigracionJsonService.name);
  private readonly asignacionesPath = path.join(
    process.cwd(),
    'asignaciones_turnos.json',
  );
  private readonly diasLibresPath = path.join(
    process.cwd(),
    'dias_libres.json',
  );

  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
    @InjectRepository(HorarioEntity)
    private readonly horarioRepo: Repository<HorarioEntity>,
    @InjectRepository(AsignacionHorario)
    private readonly asignacionRepo: Repository<AsignacionHorario>,
    @InjectRepository(DiaLibre)
    private readonly diaLibreRepo: Repository<DiaLibre>,
  ) {}

  // =========================================================
  // MIGRAR ASIGNACIONES DE HORARIO
  // =========================================================
  async migrarAsignaciones(): Promise<{
    success: boolean;
    message: string;
    totalJson: number;
    insertados: number;
    ignorados: number;
    errores: string[];
    detalles: any[];
  }> {
    this.logger.log('🔄 Migrando asignaciones de horario...');

    if (!fs.existsSync(this.asignacionesPath)) {
      return {
        success: false,
        message: `No existe ${this.asignacionesPath}`,
        totalJson: 0,
        insertados: 0,
        ignorados: 0,
        errores: [],
        detalles: [],
      };
    }

    const data = JSON.parse(fs.readFileSync(this.asignacionesPath, 'utf-8'));
    if (!Array.isArray(data)) {
      return {
        success: false,
        message: 'asignaciones_turnos.json no es un array',
        totalJson: 0,
        insertados: 0,
        ignorados: 0,
        errores: [],
        detalles: [],
      };
    }

    // Precargar empleados y horarios
    const empleados = await this.empleadoRepo.find();
    const horarios = await this.horarioRepo.find();
    const empleadoMap = new Map(
      empleados.map((e) => [normalizarCedula(e.cedula), e]),
    );
    const horarioMap = new Map(horarios.map((h) => [h.codigo, h]));

    // Precargar asignaciones existentes para no duplicar
    const asignacionesExistentes = await this.asignacionRepo.find();
    const yaAsignados = new Set(asignacionesExistentes.map((a) => a.empleadoId));

    const resultados = {
      success: true,
      message: '',
      totalJson: data.length,
      insertados: 0,
      ignorados: 0,
      errores: [] as string[],
      detalles: [] as any[],
    };

    for (const item of data) {
      const cedulaNorm = normalizarCedula(item.employeeId);
      const empleado = empleadoMap.get(cedulaNorm);

      if (!empleado) {
        resultados.ignorados++;
        resultados.detalles.push({
          empleadoId: item.employeeId,
          motivo: 'Empleado no existe en BD',
        });
        continue;
      }

      if (yaAsignados.has(empleado.id)) {
        resultados.ignorados++;
        resultados.detalles.push({
          empleadoId: item.employeeId,
          motivo: 'Ya tiene asignación activa en BD',
        });
        continue;
      }

      const horario = horarioMap.get(item.horarioId);
      if (!horario) {
        resultados.errores.push(`${item.employeeId}: horario ${item.horarioId} no existe`);
        continue;
      }

      try {
        // Crear asignación
        const nueva = this.asignacionRepo.create({
          empleadoId: empleado.id,
          horarioId: horario.id,
          fechaInicio: new Date(),
          activo: true,
        });
        await this.asignacionRepo.save(nueva);
        yaAsignados.add(empleado.id);
        resultados.insertados++;

        // Si tiene días libres fijos embebidos, crearlos también
        if (item.diasLibresFijos && item.diasLibresFijos.length > 0) {
          await this.diaLibreRepo.delete({
            empleadoId: empleado.id,
            tipo: 'FIJO',
          });

          const nuevos = item.diasLibresFijos
            .map((nombre: string) => {
              const num = nombreADia(nombre);
              if (num === -1) return null;
              return this.diaLibreRepo.create({
                empleadoId: empleado.id,
                tipo: 'FIJO',
                diaSemana: num,
                semanaInicio: null,
              });
            })
            .filter(Boolean) as DiaLibre[];

          if (nuevos.length > 0) {
            await this.diaLibreRepo.save(nuevos);
          }
        }

        resultados.detalles.push({
          empleadoId: item.employeeId,
          nombre: `${empleado.nombre} ${empleado.apellido}`,
          horarioId: item.horarioId,
          diasLibresFijos: item.diasLibresFijos || [],
          accion: 'INSERTADO',
        });
      } catch (error: any) {
        resultados.errores.push(`${item.employeeId}: ${error.message}`);
      }
    }

    resultados.message = `Migrados ${resultados.insertados} de ${resultados.totalJson} (${resultados.ignorados} ignorados, ${resultados.errores.length} errores)`;
    this.logger.log(`✅ ${resultados.message}`);

    return resultados;
  }

  // =========================================================
  // MIGRAR DÍAS LIBRES (FIJOS Y ROTATIVOS)
  // =========================================================
  async migrarDiasLibres(): Promise<{
    success: boolean;
    message: string;
    totalEmpleados: number;
    insertadosFijos: number;
    insertadosRotativos: number;
    ignorados: number;
    errores: string[];
    detalles: any[];
  }> {
    this.logger.log('🔄 Migrando días libres...');

    if (!fs.existsSync(this.diasLibresPath)) {
      return {
        success: false,
        message: `No existe ${this.diasLibresPath}`,
        totalEmpleados: 0,
        insertadosFijos: 0,
        insertadosRotativos: 0,
        ignorados: 0,
        errores: [],
        detalles: [],
      };
    }

    const data = JSON.parse(fs.readFileSync(this.diasLibresPath, 'utf-8'));
    if (typeof data !== 'object' || Array.isArray(data)) {
      return {
        success: false,
        message: 'dias_libres.json no es un objeto',
        totalEmpleados: 0,
        insertadosFijos: 0,
        insertadosRotativos: 0,
        ignorados: 0,
        errores: [],
        detalles: [],
      };
    }

    const empleados = await this.empleadoRepo.find();
    const empleadoMap = new Map(
      empleados.map((e) => [normalizarCedula(e.cedula), e]),
    );

    const resultados = {
      success: true,
      message: '',
      totalEmpleados: Object.keys(data).length,
      insertadosFijos: 0,
      insertadosRotativos: 0,
      ignorados: 0,
      errores: [] as string[],
      detalles: [] as any[],
    };

    for (const cedulaJson of Object.keys(data)) {
      const cedulaNorm = normalizarCedula(cedulaJson);
      const empleado = empleadoMap.get(cedulaNorm);

      if (!empleado) {
        resultados.ignorados++;
        resultados.errores.push(`Cédula ${cedulaJson} no existe en BD`);
        continue;
      }

      const dias = data[cedulaJson];

      // Borrar días previos del empleado para no duplicar
      await this.diaLibreRepo.delete({ empleadoId: empleado.id });

      // 1. Días FIJOS
      if (dias['_fijos'] && Array.isArray(dias['_fijos'])) {
        const nuevos = dias['_fijos']
          .map((nombre: string) => {
            const num = nombreADia(nombre);
            if (num === -1) return null;
            return this.diaLibreRepo.create({
              empleadoId: empleado.id,
              tipo: 'FIJO',
              diaSemana: num,
              semanaInicio: null,
            });
          })
          .filter(Boolean) as DiaLibre[];

        if (nuevos.length > 0) {
          await this.diaLibreRepo.save(nuevos);
          resultados.insertadosFijos += nuevos.length;
        }
      }

      // 2. Días ROTATIVOS (por semana)
      for (const key of Object.keys(dias)) {
        if (key === '_fijos') continue;
        if (!Array.isArray(dias[key])) continue;

        // key es 'YYYY-MM-DD'
        const [y, m, d] = key.split('-').map(Number);
        const semanaDate = new Date(y, m - 1, d);

        const nuevos = dias[key]
          .map((nombre: string) => {
            const num = nombreADia(nombre);
            if (num === -1) return null;
            return this.diaLibreRepo.create({
              empleadoId: empleado.id,
              tipo: 'ROTATIVO',
              diaSemana: num,
              semanaInicio: semanaDate,
            });
          })
          .filter(Boolean) as DiaLibre[];

        if (nuevos.length > 0) {
          await this.diaLibreRepo.save(nuevos);
          resultados.insertadosRotativos += nuevos.length;
        }
      }

      resultados.detalles.push({
        cedula: cedulaJson,
        nombre: `${empleado.nombre} ${empleado.apellido}`,
        fijos: dias['_fijos']?.length || 0,
        semanas: Object.keys(dias).filter((k) => k !== '_fijos').length,
      });
    }

    resultados.message = `Migrados: ${resultados.insertadosFijos} fijos + ${resultados.insertadosRotativos} rotativos (${resultados.ignorados} ignorados, ${resultados.errores.length} errores)`;
    this.logger.log(`✅ ${resultados.message}`);

    return resultados;
  }

  // =========================================================
  // MIGRAR TODO (asignaciones + días libres)
  // =========================================================
  async migrarTodo() {
    this.logger.log('🚀 Iniciando migración completa desde JSON...');

    const asignaciones = await this.migrarAsignaciones();
    const diasLibres = await this.migrarDiasLibres();

    return {
      success: true,
      message: 'Migración completa',
      asignaciones,
      diasLibres,
    };
  }

  // =========================================================
  // ESTADO: ¿Qué falta migrar?
  // =========================================================
  async estadoMigracion() {
    const asignacionesJsonExiste = fs.existsSync(this.asignacionesPath);
    const diasLibresJsonExiste = fs.existsSync(this.diasLibresPath);

    let totalAsignacionesJson = 0;
    let totalDiasLibresJson = 0;

    if (asignacionesJsonExiste) {
      try {
        const data = JSON.parse(
          fs.readFileSync(this.asignacionesPath, 'utf-8'),
        );
        totalAsignacionesJson = Array.isArray(data) ? data.length : 0;
      } catch {}
    }

    if (diasLibresJsonExiste) {
      try {
        const data = JSON.parse(fs.readFileSync(this.diasLibresPath, 'utf-8'));
        totalDiasLibresJson = Object.keys(data).length;
      } catch {}
    }

    const asignacionesBD = await this.asignacionRepo.count({
      where: { activo: true },
    });
    const diasLibresBD = await this.diaLibreRepo.count();

    return {
      success: true,
      json: {
        asignacionesJson: {
          existe: asignacionesJsonExiste,
          total: totalAsignacionesJson,
        },
        diasLibresJson: {
          existe: diasLibresJsonExiste,
          totalEmpleados: totalDiasLibresJson,
        },
      },
      bd: {
        asignacionesActivas: asignacionesBD,
        diasLibresTotal: diasLibresBD,
      },
      faltante: {
        asignaciones: Math.max(0, totalAsignacionesJson - asignacionesBD),
        diasLibresEmpleados: Math.max(
          0,
          totalDiasLibresJson -
            (await this.diaLibreRepo
              .createQueryBuilder('d')
              .select('COUNT(DISTINCT d.empleadoId)', 'count')
              .getRawOne()
              .then((r) => Number(r.count))),
        ),
      },
    };
  }
}