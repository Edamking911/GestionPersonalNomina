import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from 'exceljs';
import { ReglasConfigService } from '../Configs/reglas-config.service';
import { CacheEmpleadosService } from '../Cache/cache-empleados.service';
import { ReportesService } from '../Reportes/reportes.service';
import {TODOS_LOS_DIAS,formatoFechaLocal,normalizarDia,nombreADia,obtenerInicioSemana, normalizarCedula, stringFechaADate} from '../Utils/tiempo.util';
import { HorarioAsistencia as HorarioEntity } from '../../Entitys/HorariosAsistencia/HorarioAsistencia.entity';
import { AsignacionHorario } from '../../Entitys/AsignacionHorario/AsignacionHorario.entity';
import { DiaLibre } from '../../Entitys/DiaLibre/DiaLibre.entity';
import { Empleado } from '../../Entitys/Empleados/Empleado.entity';

@Injectable()
export class AsignacionesService {
  private readonly logger = new Logger(AsignacionesService.name);

  constructor(
    private readonly config: ReglasConfigService,
    private readonly cache: CacheEmpleadosService,
    private readonly reportes: ReportesService,
    @InjectRepository(HorarioEntity)
    private readonly horarioRepo: Repository<HorarioEntity>,
    @InjectRepository(AsignacionHorario)
    private readonly asignacionRepo: Repository<AsignacionHorario>,
    @InjectRepository(DiaLibre)
    private readonly diaLibreRepo: Repository<DiaLibre>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  // =========================================================
  // GET ASIGNACIONES
  // =========================================================
  async getAsignaciones(semana?: string, generarExcel = false) {
    let semanaClave: string;
    if (semana) {
      semanaClave = obtenerInicioSemana(stringFechaADate(semana));
    } else {
      semanaClave = obtenerInicioSemana(new Date());
    }

    const resultado: any[] = [];
    const mapaNombres = await this.cache.obtenerMapaNombres();
    const activos = await this.cache.obtenerSetEmpleadosActivos();

    for (const a of this.config.getAsignaciones()) {
      if (activos.size > 0 && !activos.has(String(a.employeeId))) continue;

      const diasLibresRotativos =
        this.config.getDiasLibres()[a.employeeId]?.[semanaClave] || [];
      const diasLibresFijos =
        this.config.getDiasLibres()[a.employeeId]?.['_fijos'] || [];

      const nombre = this.cache.resolverNombre(a.employeeId, [], mapaNombres);
      const horario = this.config.getHorarioPorId(a.horarioId);

      resultado.push({
        employeeId: a.employeeId,
        nombre,
        horarioId: a.horarioId,
        horarioNombre: horario?.nombre || 'SIN HORARIO',
        entrada: horario?.entrada || '',
        salida: horario?.salida || '',
        diasLibresFijos,
        diasLibresRotativos,
        diasLibresEfectivos:
          diasLibresRotativos.length > 0 ? diasLibresRotativos : diasLibresFijos,
        semana: semanaClave,
      });
    }

    if (generarExcel) {
      const columnas = [
        { header: 'Cédula', key: 'employeeId', width: 15 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Horario', key: 'horarioNombre', width: 25 },
        { header: 'Entrada', key: 'entrada', width: 12 },
        { header: 'Salida', key: 'salida', width: 12 },
        { header: 'Días Libres Fijos', key: 'diasLibresFijos', width: 25 },
        { header: 'Días Libres Rotativos', key: 'diasLibresRotativos', width: 25 },
        { header: 'Días Libres Efectivos', key: 'diasLibresEfectivos', width: 25 },
        { header: 'Semana', key: 'semana', width: 18 },
      ];

      const filas = resultado.map((r) => ({
        ...r,
        diasLibresFijos: r.diasLibresFijos.join(', '),
        diasLibresRotativos: r.diasLibresRotativos.join(', '),
        diasLibresEfectivos: r.diasLibresEfectivos.join(', '),
      }));

      const buffer = await this.generarExcelBuffer('Asignaciones', columnas, filas);
      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="asignaciones_${semanaClave}.xlsx"`,
      });
    }

    return { semana: semanaClave, total: resultado.length, asignaciones: resultado };
  }

  // =========================================================
  // ASIGNAR HORARIO
  // =========================================================
  async asignarHorario(
    employeeId: string,
    horarioId: string,
    diasLibresFijos?: string[],
  ) {
    const horario = await this.horarioRepo.findOne({ where: { codigo: horarioId } });
    if (!horario) {
      return { success: false, message: 'Horario no válido' };
    }

    // ✅ Buscar por cédula normalizada
    const empleados = await this.empleadoRepo.find();
    const cedulaNorm = normalizarCedula(employeeId);
    const empleado = empleados.find(
      (e) => normalizarCedula(e.cedula) === cedulaNorm,
    );

    if (!empleado) {
      return { success: false, message: `Empleado ${employeeId} no encontrado` };
    }

    // Cerrar asignación activa anterior
    const anterior = await this.asignacionRepo.findOne({
      where: { empleadoId: empleado.id, activo: true },
    });

    if (anterior) {
      const diaAntes = new Date();
      diaAntes.setDate(diaAntes.getDate() - 1);
      anterior.fechaFin = diaAntes;
      anterior.activo = false;
      await this.asignacionRepo.save(anterior);
    }

    // Crear nueva asignación
    const nueva = this.asignacionRepo.create({
      empleadoId: empleado.id,
      horarioId: horario.id,
      fechaInicio: new Date(),
      activo: true,
    });
    await this.asignacionRepo.save(nueva);

    // Días libres fijos
    if (diasLibresFijos !== undefined) {
      await this.diaLibreRepo.delete({
        empleadoId: empleado.id,
        tipo: 'FIJO',
      });

      if (diasLibresFijos.length > 0) {
        const nuevos = diasLibresFijos
          .map((nombre) => {
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
    }

    await this.config.recargar();
    this.reportes.limpiarCaches();

    return {
      success: true,
      message: `Horario ${horarioId} asignado al empleado ${employeeId}`,
    };
  }

  // =========================================================
  // ASIGNAR DÍAS LIBRES ROTATIVOS
  // =========================================================
  async asignarDiasLibres(employeeId: string, semana: string, diasLibres: string[]) {
    const empleados = await this.empleadoRepo.find();
    const cedulaNorm = normalizarCedula(employeeId);
    const empleado = empleados.find(
      (e) => normalizarCedula(e.cedula) === cedulaNorm,
    );

    if (!empleado) {
      return { success: false, message: `Empleado ${employeeId} no encontrado` };
    }

    const semanaClave = obtenerInicioSemana(stringFechaADate(semana));
    // ✅ FIX timezone: construir Date LOCAL
    const semanaDate = stringFechaADate(semanaClave);

    // Borrar rotativos viejos de esa semana
    await this.diaLibreRepo.delete({
      empleadoId: empleado.id,
      tipo: 'ROTATIVO',
      semanaInicio: semanaDate,
    });

    // Crear nuevos
    if (diasLibres.length > 0) {
      const nuevos = diasLibres
        .map((nombre) => {
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
      }
    }

    await this.config.recargar();
    this.reportes.limpiarCaches();

    return { success: true, message: 'Días libres asignados' };
  }

  // =========================================================
  // PARSEAR EXCEL
  // =========================================================
  private async parsearExcelAsignaciones(buffer: Buffer): Promise<{
    filas: any[];
    errores: string[];
    domingos: string[];
  }> {
    const workbook: any = new Workbook();
    await workbook.xlsx.load(buffer as any);

    const hoja: any = workbook.getWorksheet('Asignaciones');
    if (!hoja) return { filas: [], errores: ['No se encontró la hoja "Asignaciones"'], domingos: [] };

    const headerRow = hoja.getRow(1);
    const domingos: string[] = [];
    const columnasSemanas: { colIndex: number; semana: string }[] = [];

    headerRow.eachCell((cell: any, colNumber: number) => {
      const valor = String(cell.value || '');
      const match = valor.match(/\((\d{4}-\d{2}-\d{2})\)/);
      if (match) {
        columnasSemanas.push({ colIndex: colNumber, semana: match[1] });
        domingos.push(match[1]);
      }
    });

    const filas: any[] = [];

    hoja.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return;

      const cedulaRaw = String(row.getCell(1).value || '').trim();
      const nombre = String(row.getCell(2).value || '').trim();
      const horarioId = String(row.getCell(3).value || '').trim();
      const diasLibresFijosRaw = String(row.getCell(4).value || '').trim();

      if (!cedulaRaw) return;

      // ✅ FIX: usar normalizarCedula, conserva solo números
      const cedulaLimpia = normalizarCedula(cedulaRaw);
      if (!cedulaLimpia) return;

      const diasLibresFijos = diasLibresFijosRaw
        ? diasLibresFijosRaw.split(',').map((d: string) => normalizarDia(d)).filter(Boolean)
        : [];

      const semanas: { semana: string; dias: string[] }[] = [];
      for (const col of columnasSemanas) {
        const valor = String(row.getCell(col.colIndex).value || '').trim();
        const sinAsterisco = valor.replace(/\*/g, '').trim();
        const dias = sinAsterisco
          ? sinAsterisco.split(',').map((d: string) => normalizarDia(d)).filter(Boolean)
          : [];
        semanas.push({ semana: col.semana, dias });
      }

      filas.push({
        fila: rowNumber,
        employeeId: cedulaLimpia,
        nombreReferencia: nombre,
        horarioId,
        diasLibresFijos,
        semanas,
      });
    });

    return { filas, errores: [], domingos };
  }

  // =========================================================
  // VALIDAR EXCEL
  // =========================================================
  async validarExcelAsignaciones(buffer: Buffer) {
    const { filas } = await this.parsearExcelAsignaciones(buffer);
    const errores: any[] = [];
    const preview: any[] = [];

    const empleados = await this.empleadoRepo.find();
    const horarios = await this.horarioRepo.find({ where: { activo: true } });

    // Normalizar cédulas para comparar
    const cedulasValidas = new Set(
      empleados.map((e) => normalizarCedula(e.cedula)),
    );
    const horariosValidos = new Set(horarios.map((h) => h.codigo));
    const diasValidos = new Set(TODOS_LOS_DIAS);
    const cedulasVistas = new Set<string>();

    for (const fila of filas) {
      if (cedulasVistas.has(fila.employeeId)) {
        errores.push({ fila: fila.fila, error: `Cédula ${fila.employeeId} duplicada` });
        continue;
      }
      cedulasVistas.add(fila.employeeId);

      if (!cedulasValidas.has(fila.employeeId)) {
        errores.push({ fila: fila.fila, error: `Cédula ${fila.employeeId} no existe en la BD` });
        continue;
      }

      const empleado = empleados.find(
        (e) => normalizarCedula(e.cedula) === fila.employeeId,
      );
      if (empleado && empleado.estado !== 'ACTIVO') {
        errores.push({
          fila: fila.fila,
          error: `Empleado ${empleado.nombre} ${empleado.apellido} está ${empleado.estado}`,
        });
        continue;
      }

      if (fila.horarioId && !horariosValidos.has(fila.horarioId)) {
        errores.push({ fila: fila.fila, error: `Horario "${fila.horarioId}" no existe` });
        continue;
      }

      const diasFijosInvalidos = fila.diasLibresFijos.filter((d: string) => !diasValidos.has(d));
      if (diasFijosInvalidos.length > 0) {
        errores.push({
          fila: fila.fila,
          error: `Días inválidos: ${diasFijosInvalidos.join(', ')}`,
        });
        continue;
      }

      let errorSemana = false;
      for (const semana of fila.semanas) {
        const invalidos = semana.dias.filter((d: string) => !diasValidos.has(d));
        if (invalidos.length > 0) {
          errores.push({ fila: fila.fila, error: `Semana ${semana.semana}: días inválidos` });
          errorSemana = true;
        }
      }
      if (errorSemana) continue;

      // =========================================================
      // ✅ CAMBIO: Detectar TODOS los cambios (horario + días libres)
      // =========================================================
      const asignacionActual = this.config
        .getAsignaciones()
        .find((a) => a.employeeId === fila.employeeId);

      const cambios: string[] = [];

      // 1. Comparar HORARIO
      if (fila.horarioId && fila.horarioId !== (asignacionActual?.horarioId || null)) {
        cambios.push(
          `Horario: ${asignacionActual?.horarioId || 'ninguno'} → ${fila.horarioId}`,
        );
      }

      // 2. Comparar DÍAS LIBRES FIJOS
      const diasFijosActuales =
        this.config.getDiasLibres()[fila.employeeId]?.['_fijos'] || [];
      const fijosActualesSorted = [...diasFijosActuales].sort();
      const fijosNuevosSorted = [...fila.diasLibresFijos].sort();

      if (JSON.stringify(fijosActualesSorted) !== JSON.stringify(fijosNuevosSorted)) {
        cambios.push(
          `Días fijos: [${diasFijosActuales.join(', ') || 'ninguno'}] → [${fila.diasLibresFijos.join(', ') || 'ninguno'}]`,
        );
      }

      // 3. Comparar DÍAS LIBRES ROTATIVOS (por semana)
      for (const semana of fila.semanas) {
        const diasRotActuales =
          this.config.getDiasLibres()[fila.employeeId]?.[semana.semana] || [];
        const rotActualesSorted = [...diasRotActuales].sort();
        const rotNuevosSorted = [...semana.dias].sort();

        if (JSON.stringify(rotActualesSorted) !== JSON.stringify(rotNuevosSorted)) {
          cambios.push(
            `Sem ${semana.semana}: [${diasRotActuales.join(', ') || 'ninguno'}] → [${semana.dias.join(', ') || 'ninguno'}]`,
          );
        }
      }

      preview.push({
        fila: fila.fila,
        employeeId: fila.employeeId,
        nombre: fila.nombreReferencia,
        cambios: cambios.length > 0 ? cambios : ['Sin cambios'],
      });
    }

    return {
      success: true,
      totalFilas: filas.length,
      filasValidas: filas.length - errores.length,
      filasConError: errores.length,
      errores,
      preview,
    };
  }

  // =========================================================
  // IMPORTAR EXCEL
  // =========================================================
  async importarExcelAsignaciones(buffer: Buffer) {
    const validacion = await this.validarExcelAsignaciones(buffer);

    if (validacion.filasConError > 0) {
      return {
        success: false,
        message: 'Hay errores en el Excel. Corrígelos y vuelve a intentar.',
        errores: validacion.errores,
      };
    }

    const { filas } = await this.parsearExcelAsignaciones(buffer);

    const empleados = await this.empleadoRepo.find();
    const horarios = await this.horarioRepo.find({ where: { activo: true } });

    // ✅ Map con cédulas normalizadas
    const empleadoMap = new Map(
      empleados.map((e) => [normalizarCedula(e.cedula), e]),
    );
    const horarioMap = new Map(horarios.map((h) => [h.codigo, h]));

    let horariosActualizados = 0;
    let diasLibresActualizados = 0;
    let diasLibresEliminados = 0;

    for (const fila of filas) {
      const empleado = empleadoMap.get(fila.employeeId);
      if (!empleado) continue;

      // Asignar horario
      if (fila.horarioId) {
        const horario = horarioMap.get(fila.horarioId);
        if (horario) {
          const anterior = await this.asignacionRepo.findOne({
            where: { empleadoId: empleado.id, activo: true },
          });

          if (!anterior || anterior.horarioId !== horario.id) {
            if (anterior) {
              const diaAntes = new Date();
              diaAntes.setDate(diaAntes.getDate() - 1);
              anterior.fechaFin = diaAntes;
              anterior.activo = false;
              await this.asignacionRepo.save(anterior);
            }

            const nueva = this.asignacionRepo.create({
              empleadoId: empleado.id,
              horarioId: horario.id,
              fechaInicio: new Date(),
              activo: true,
            });
            await this.asignacionRepo.save(nueva);
            horariosActualizados++;
          }
        }
      }

      // Días libres fijos
      await this.diaLibreRepo.delete({ empleadoId: empleado.id, tipo: 'FIJO' });
      if (fila.diasLibresFijos.length > 0) {
        const nuevos = fila.diasLibresFijos
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
          diasLibresActualizados += nuevos.length;
        }
      }

      // Días libres rotativos
      for (const semana of fila.semanas) {
        // ✅ FIX timezone
        const semanaDate = stringFechaADate(semana.semana);

        const sonIgualesALosFijos =
          JSON.stringify([...semana.dias].sort()) ===
          JSON.stringify([...fila.diasLibresFijos].sort());

        if (sonIgualesALosFijos || semana.dias.length === 0) {
          const r = await this.diaLibreRepo.delete({
            empleadoId: empleado.id,
            tipo: 'ROTATIVO',
            semanaInicio: semanaDate,
          });
          if ((r.affected ?? 0) > 0) diasLibresEliminados++;
          continue;
        }

        await this.diaLibreRepo.delete({
          empleadoId: empleado.id,
          tipo: 'ROTATIVO',
          semanaInicio: semanaDate,
        });

        const nuevos = semana.dias
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
          diasLibresActualizados += nuevos.length;
        }
      }
    }

    await this.config.recargar();
    this.reportes.limpiarCaches();

    return {
      success: true,
      message: 'Excel importado correctamente',
      horariosActualizados,
      diasLibresActualizados,
      diasLibresEliminados,
    };
  }

  // =========================================================
  // PLANTILLA EXCEL
  // =========================================================
  async generarPlantillaAsignaciones(mes?: string): Promise<StreamableFile> {
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

    const domingos: Date[] = [];
    const ultimoDia = new Date(año, mesNum + 1, 0).getDate();
    for (let d = 1; d <= ultimoDia; d++) {
      const fecha = new Date(año, mesNum, d);
      if (fecha.getDay() === 0) domingos.push(fecha);
    }

    const nombreMes = new Date(año, mesNum, 1).toLocaleDateString('es-VE', {
      month: 'long',
      year: 'numeric',
    });

    const workbook: any = new Workbook();

    const empleados = await this.empleadoRepo.find({
      where: { estado: 'ACTIVO' },
      order: { nombre: 'ASC' },
    });

    const horarios = await this.horarioRepo.find({ where: { activo: true } });

    const hojaAsignaciones: any = workbook.addWorksheet('Asignaciones');
    const columnasFijas = [
      { header: 'Cédula', key: 'employeeId', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Horario', key: 'horarioId', width: 18 },
      { header: 'Días Libres Fijos', key: 'diasLibresFijos', width: 22 },
    ];
    const columnasSemanas = domingos.map((dom, idx) => ({
      header: `Libres Sem ${idx + 1} (${formatoFechaLocal(dom)})`,
      key: `sem${idx + 1}`,
      width: 22,
    }));

    hojaAsignaciones.columns = [...columnasFijas, ...columnasSemanas];
    const headerAsignaciones = hojaAsignaciones.getRow(1);
    headerAsignaciones.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerAsignaciones.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    headerAsignaciones.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerAsignaciones.height = 32;

    for (const emp of empleados) {
      const cedulaNorm = normalizarCedula(emp.cedula);
      const asignacion = this.config
        .getAsignaciones()
        .find((a) => a.employeeId === cedulaNorm);

      const diasFijos = this.config.getDiasLibres()[cedulaNorm]?.['_fijos'] || [];

      const fila: any = {
        employeeId: emp.cedula,  // ✅ Mostrar la cédula completa (con V-)
        nombre: `${emp.nombre} ${emp.apellido}`.trim(),
        horarioId: asignacion?.horarioId || '',
        diasLibresFijos: diasFijos.join(', '),
      };

      domingos.forEach((dom, idx) => {
        const semanaClave = formatoFechaLocal(dom);
        const diasRot = this.config.getDiasLibres()[cedulaNorm]?.[semanaClave] || [];
        const diasEfectivos = diasRot.length > 0 ? diasRot : diasFijos;
        fila[`sem${idx + 1}`] = diasEfectivos.join(', ');
      });

      const nuevaFila = hojaAsignaciones.addRow(fila);
      const colorFondo = asignacion ? 'E2EFDA' : 'FFF2CC';
      nuevaFila.eachCell((cell: any) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorFondo } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'D0D0D0' } },
          left: { style: 'thin', color: { argb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
          right: { style: 'thin', color: { argb: 'D0D0D0' } },
        };
      });
    }

    // Hoja Leyenda
    const hojaLeyenda: any = workbook.addWorksheet('Leyenda');
    hojaLeyenda.columns = [
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Significado', key: 'significado', width: 60 },
    ];
    const hl = hojaLeyenda.getRow(1);
    hl.font = { bold: true, color: { argb: 'FFFFFF' } };
    hl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    hl.alignment = { vertical: 'middle', horizontal: 'center' };
    hojaLeyenda.addRow({ color: 'Verde', significado: 'Empleado CON asignación' });
    hojaLeyenda.addRow({ color: 'Amarillo', significado: 'Empleado SIN asignación' });

    // Hoja Instrucciones
    const hojaInstrucciones: any = workbook.addWorksheet('Instrucciones');
    hojaInstrucciones.columns = [
      { header: 'Campo', key: 'campo', width: 35 },
      { header: 'Descripción', key: 'descripcion', width: 90 },
    ];
    const hi = hojaInstrucciones.getRow(1);
    hi.font = { bold: true, color: { argb: 'FFFFFF' } };
    hi.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    hi.alignment = { vertical: 'middle', horizontal: 'center' };
    hojaInstrucciones.addRows([
      { campo: `📅 Mes: ${nombreMes}`, descripcion: `Semanas: ${domingos.length}` },
      { campo: 'Cédula', descripcion: 'V-20111222 o 20111222 (ambos válidos).' },
      { campo: 'Horario', descripcion: 'Código del horario (ver hoja "Horarios Válidos").' },
      { campo: 'Días Libres Fijos', descripcion: 'Ej: sábado, domingo.' },
      { campo: 'Libres Sem N', descripcion: 'Días rotativos por semana (opcional).' },
    ]);

    // Hoja Horarios
    const hojaHorarios: any = workbook.addWorksheet('Horarios Válidos');
    hojaHorarios.columns = [
      { header: 'Código', key: 'codigo', width: 20 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Entrada', key: 'entrada', width: 12 },
      { header: 'Salida', key: 'salida', width: 12 },
    ];
    const hh = hojaHorarios.getRow(1);
    hh.font = { bold: true, color: { argb: 'FFFFFF' } };
    hh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    hh.alignment = { vertical: 'middle', horizontal: 'center' };
    for (const h of horarios) {
      hojaHorarios.addRow({
        codigo: h.codigo,
        nombre: h.nombre,
        entrada: h.horaEntrada,
        salida: h.horaSalida,
      });
    }

    // Hoja Empleados
    const hojaEmpleados: any = workbook.addWorksheet('Empleados Activos');
    hojaEmpleados.columns = [
      { header: 'Cédula', key: 'cedula', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 35 },
    ];
    const he = hojaEmpleados.getRow(1);
    he.font = { bold: true, color: { argb: 'FFFFFF' } };
    he.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    he.alignment = { vertical: 'middle', horizontal: 'center' };
    for (const emp of empleados) {
      hojaEmpleados.addRow({
        cedula: emp.cedula,
        nombre: `${emp.nombre} ${emp.apellido}`.trim(),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="plantilla_asignaciones_${año}-${String(mesNum + 1).padStart(2, '0')}.xlsx"`,
    });
  }

  // =========================================================
  // HELPER
  // =========================================================
  private async generarExcelBuffer(
    nombreHoja: string,
    columnas: { header: string; key: string; width: number }[],
    filas: any[],
  ): Promise<Buffer> {
    const workbook: any = new Workbook();
    const worksheet: any = workbook.addWorksheet(nombreHoja);
    worksheet.columns = columnas;
    const hr = worksheet.getRow(1);
    hr.font = { bold: true, color: { argb: 'FFFFFF' } };
    hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    hr.alignment = { vertical: 'middle', horizontal: 'center' };
    for (const fila of filas) worksheet.addRow(fila);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}