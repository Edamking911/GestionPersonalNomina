import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Workbook } from 'exceljs';
import { ReglasConfigService } from '../Configs/reglas-config.service';
import { CacheEmpleadosService } from '../Cache/cache-empleados.service';
import { ReportesService } from '../Reportes/reportes.service';
import {
  TODOS_LOS_DIAS,
  formatoFechaLocal,
  normalizarDia,
} from '../Utils/tiempo.util';

@Injectable()
export class AsignacionesService {
  private readonly logger = new Logger(AsignacionesService.name);
  private readonly marcajesPath = path.join(process.cwd(), 'marcajes.json');

  constructor(
    private readonly config: ReglasConfigService,
    private readonly cache: CacheEmpleadosService,
    private readonly reportes: ReportesService,
  ) {}

  private leerMarcajes(): any[] {
    if (!fs.existsSync(this.marcajesPath)) return [];
    return JSON.parse(fs.readFileSync(this.marcajesPath, 'utf-8'));
  }

  // ============ GET ASIGNACIONES ============
  async getAsignaciones(semana?: string, generarExcel = false) {
    let semanaClave: string;
    if (semana) {
      const [year, month, day] = semana.split('-').map(Number);
      const fecha = new Date(year, month - 1, day);
      semanaClave = require('../Utils/tiempo.util').obtenerInicioSemana(fecha);
    } else {
      semanaClave = require('../Utils/tiempo.util').obtenerInicioSemana(new Date());
    }

    const marcajes = this.leerMarcajes();
    const resultado: any[] = [];
    const mapaNombres = await this.cache.obtenerMapaNombres();
    const activos = await this.cache.obtenerSetEmpleadosActivos();

    for (const a of this.config.getAsignaciones()) {
      if (activos.size > 0 && !activos.has(String(a.employeeId))) continue;

      const diasLibresRotativos = this.config.getDiasLibres()[a.employeeId]?.[semanaClave] || [];
      const nombre = this.cache.resolverNombre(a.employeeId, marcajes, mapaNombres);
      const horario = this.config.getHorarioPorId(a.horarioId);

      resultado.push({
        employeeId: a.employeeId,
        nombre,
        horarioId: a.horarioId,
        horarioNombre: horario?.nombre || 'SIN HORARIO',
        entrada: horario?.entrada || '',
        salida: horario?.salida || '',
        diasLibresFijos: a.diasLibresFijos || [],
        diasLibresRotativos,
        diasLibresEfectivos:
          diasLibresRotativos.length > 0 ? diasLibresRotativos : a.diasLibresFijos || [],
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

  // ============ ASIGNAR ============
  async asignarHorario(employeeId: string, horarioId: string, diasLibresFijos?: string[]) {
    if (!this.config.getHorarioPorId(horarioId)) {
      return { success: false, message: 'Horario no válido' };
    }

    const validacion = await this.cache.validarEmpleadoActivo(employeeId);
    if (!validacion.activo) {
      return { success: false, message: validacion.mensaje || 'El empleado no está activo.' };
    }

    const asignaciones = this.config.getAsignaciones();
    const existente = asignaciones.find((a) => a.employeeId === employeeId);
    if (existente) {
      existente.horarioId = horarioId;
      existente.diasLibresFijos = diasLibresFijos;
    } else {
      asignaciones.push({ employeeId, horarioId, diasLibresFijos });
    }

    this.config.setAsignaciones(asignaciones);
    this.config.guardarAsignaciones();
    this.reportes.limpiarCaches();

    return { success: true, message: `Horario ${horarioId} asignado al empleado ${employeeId}` };
  }

  async asignarDiasLibres(employeeId: string, semana: string, diasLibres: string[]) {
    const validacion = await this.cache.validarEmpleadoActivo(employeeId);
    if (!validacion.activo) {
      return { success: false, message: validacion.mensaje || 'El empleado no está activo.' };
    }

    const [year, month, day] = semana.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const semanaClave = require('../Utils/tiempo.util').obtenerInicioSemana(fecha);

    const dias = this.config.getDiasLibres();
    if (!dias[employeeId]) dias[employeeId] = {};
    dias[employeeId][semanaClave] = diasLibres;

    this.config.setDiasLibres(dias);
    this.config.guardarDiasLibres();
    this.reportes.limpiarCaches();

    return { success: true, message: 'Días libres asignados' };
  }

  // ============ EXCEL ASIGNACIONES ============
  private async parsearExcelAsignaciones(buffer: Buffer): Promise<{
    filas: any[];
    errores: string[];
    domingos: string[];
  }> {
    const workbook: any = new Workbook();
    await workbook.xlsx.load(buffer);

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
      if (cedulaRaw === '12345678' && nombre.toLowerCase().includes('ejemplo')) return;

      const cedulaLimpia = cedulaRaw.replace(/[^0-9]/g, '');
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

  async validarExcelAsignaciones(buffer: Buffer) {
    const { filas } = await this.parsearExcelAsignaciones(buffer);
    const errores: any[] = [];
    const preview: any[] = [];

    let empleadosBiometrico: any[] = [];
    try {
      const usuarios = await this.cache['biometricoService'].listUsers('172.18.0.89', 'admin', 'Dtd2026*', true);
      if (usuarios?.success) empleadosBiometrico = usuarios.usuarios;
    } catch {}

    const idsValidos = new Set(empleadosBiometrico.map((u) => String(u.employeeNo)));
    const horariosValidos = new Set(this.config.getReglas().horarios.map((h) => h.id));
    const diasValidos = new Set(TODOS_LOS_DIAS);
    const cedulasVistas = new Set<string>();

    for (const fila of filas) {
      if (cedulasVistas.has(fila.employeeId)) {
        errores.push({ fila: fila.fila, error: `Cédula ${fila.employeeId} duplicada` });
        continue;
      }
      cedulasVistas.add(fila.employeeId);

      if (!idsValidos.has(fila.employeeId)) {
        errores.push({ fila: fila.fila, error: `Cédula ${fila.employeeId} no existe en el biométrico` });
        continue;
      }

      const empleado = empleadosBiometrico.find((u: any) => String(u.employeeNo) === String(fila.employeeId));
      if (empleado && empleado.activo === false) {
        errores.push({ fila: fila.fila, error: `Empleado ${empleado.name} está desactivado.` });
        continue;
      }

      if (fila.horarioId && !horariosValidos.has(fila.horarioId)) {
        errores.push({ fila: fila.fila, error: `Horario "${fila.horarioId}" no existe` });
        continue;
      }

      const diasFijosInvalidos = fila.diasLibresFijos.filter((d: string) => !diasValidos.has(d));
      if (diasFijosInvalidos.length > 0) {
        errores.push({ fila: fila.fila, error: `Días inválidos: ${diasFijosInvalidos.join(', ')}` });
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

      // Diff preview
      const asignacionActual = this.config.getAsignaciones().find((a) => a.employeeId === fila.employeeId);
      const cambios: string[] = [];
      if (fila.horarioId && fila.horarioId !== (asignacionActual?.horarioId || null)) {
        cambios.push(`Horario: ${asignacionActual?.horarioId || 'ninguno'} → ${fila.horarioId}`);
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

  async importarExcelAsignaciones(buffer: Buffer) {
    const validacion = await this.validarExcelAsignaciones(buffer);

    if (validacion.filasConError > 0) {
      return {
        success: false,
        message: 'Hay errores en el Excel. Corrígelos y vuelve a intentar.',
        errores: validacion.errores,
      };
    }

    // Backup
    const backupDir = path.join(process.cwd(), 'backups_asignaciones');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup_${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(this.config.obtenerSnapshot(), null, 2), 'utf-8');

    const { filas } = await this.parsearExcelAsignaciones(buffer);

    const activos = await this.cache.obtenerSetEmpleadosActivos(true);
    const inactivos = filas.filter((f) => activos.size > 0 && !activos.has(String(f.employeeId)));
    if (inactivos.length > 0) {
      return {
        success: false,
        message: `No se puede importar: ${inactivos.length} empleado(s) están desactivados.`,
        empleadosInactivos: inactivos.map((f) => ({ fila: f.fila, employeeId: f.employeeId, nombre: f.nombreReferencia })),
      };
    }

    let horariosActualizados = 0;
    let diasLibresActualizados = 0;
    let diasLibresEliminados = 0;

    const asignaciones = this.config.getAsignaciones();
    const diasLibres = this.config.getDiasLibres();

    for (const fila of filas) {
      if (fila.horarioId) {
        const existente = asignaciones.find((a) => a.employeeId === fila.employeeId);
        if (existente) {
          existente.horarioId = fila.horarioId;
          existente.diasLibresFijos = fila.diasLibresFijos.length > 0 ? fila.diasLibresFijos : undefined;
        } else {
          asignaciones.push({
            employeeId: fila.employeeId,
            horarioId: fila.horarioId,
            diasLibresFijos: fila.diasLibresFijos.length > 0 ? fila.diasLibresFijos : undefined,
          });
        }
        horariosActualizados++;
      }

      for (const semana of fila.semanas) {
        const sonIgualesALosFijos =
          JSON.stringify([...semana.dias].sort()) === JSON.stringify([...fila.diasLibresFijos].sort());

        if (sonIgualesALosFijos) {
          if (diasLibres[fila.employeeId]?.[semana.semana]) {
            delete diasLibres[fila.employeeId][semana.semana];
            diasLibresEliminados++;
          }
          continue;
        }

        if (semana.dias.length > 0) {
          if (!diasLibres[fila.employeeId]) diasLibres[fila.employeeId] = {};
          diasLibres[fila.employeeId][semana.semana] = semana.dias;
          diasLibresActualizados++;
        } else {
          if (diasLibres[fila.employeeId]?.[semana.semana]) {
            delete diasLibres[fila.employeeId][semana.semana];
            diasLibresEliminados++;
          }
        }
      }
    }

    // Limpiar entradas vacías
    for (const empId of Object.keys(diasLibres)) {
      if (Object.keys(diasLibres[empId]).length === 0) delete diasLibres[empId];
    }

    this.config.setAsignaciones(asignaciones);
    this.config.setDiasLibres(diasLibres);
    this.config.guardarAsignaciones();
    this.config.guardarDiasLibres();
    this.reportes.limpiarCaches();

    return {
      success: true,
      message: 'Excel importado correctamente',
      horariosActualizados,
      diasLibresActualizados,
      diasLibresEliminados,
      backupPath,
    };
  }

  // ============ PLANTILLA EXCEL ============
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
    const marcajes = this.leerMarcajes();

    let empleadosBiometrico: any[] = [];
    const mapaNombres = new Map<string, string>();
    try {
      const usuarios = await this.cache['biometricoService'].listUsers('172.18.0.89', 'admin', 'Dtd2026*', true);
      if (usuarios?.success) {
        empleadosBiometrico = usuarios.usuarios;
        empleadosBiometrico.forEach((u: any) => mapaNombres.set(u.employeeNo, u.name));
      }
    } catch {}

    const idsAsignados = new Set(this.config.getAsignaciones().map((a) => a.employeeId));
    const listaEmpleados: { employeeId: string; nombre: string }[] = [];

    empleadosBiometrico.filter((u: any) => u.activo !== false).forEach((u: any) => {
      listaEmpleados.push({ employeeId: u.employeeNo, nombre: u.name });
    });

    for (const id of idsAsignados) {
      if (!listaEmpleados.some((e) => e.employeeId === id)) {
        const empleadoBio = empleadosBiometrico.find((u: any) => u.employeeNo === id);
        if (empleadoBio && empleadoBio.activo === false) continue;
        const nombre = mapaNombres.get(id) || (await this.cache.obtenerNombreEmpleado(id, marcajes));
        listaEmpleados.push({ employeeId: id, nombre });
      }
    }

    listaEmpleados.sort((a, b) => a.nombre.localeCompare(b.nombre));

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

    for (const emp of listaEmpleados) {
      const asignacion = this.config.getAsignaciones().find((a) => a.employeeId === emp.employeeId);
      const fila: any = {
        employeeId: emp.employeeId,
        nombre: emp.nombre,
        horarioId: asignacion?.horarioId || '',
        diasLibresFijos: asignacion?.diasLibresFijos?.join(', ') || '',
      };

      domingos.forEach((dom, idx) => {
        const semanaClave = formatoFechaLocal(dom);
        const diasRotativos = this.config.getDiasLibres()[emp.employeeId]?.[semanaClave] || [];
        const diasEfectivos = diasRotativos.length > 0 ? diasRotativos : asignacion?.diasLibresFijos || [];
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
      { campo: 'Cédula', descripcion: 'Solo números. Debe existir en el biométrico.' },
      { campo: 'Horario', descripcion: 'ID del horario (ver hoja "Horarios Válidos").' },
      { campo: 'Días Libres Fijos', descripcion: 'Ej: sábado, domingo.' },
      { campo: 'Libres Sem N', descripcion: 'Días rotativos por semana (opcional).' },
    ]);

    // Hoja Horarios
    const hojaHorarios: any = workbook.addWorksheet('Horarios Válidos');
    hojaHorarios.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Entrada', key: 'entrada', width: 12 },
      { header: 'Salida', key: 'salida', width: 12 },
    ];
    const hh = hojaHorarios.getRow(1);
    hh.font = { bold: true, color: { argb: 'FFFFFF' } };
    hh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    hh.alignment = { vertical: 'middle', horizontal: 'center' };
    for (const h of this.config.getReglas().horarios) {
      hojaHorarios.addRow({ id: h.id, nombre: h.nombre, entrada: h.entrada, salida: h.salida });
    }

    // Hoja Empleados
    const hojaEmpleados: any = workbook.addWorksheet('Empleados Activos');
    hojaEmpleados.columns = [
      { header: 'Cédula', key: 'employeeId', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 35 },
    ];
    const he = hojaEmpleados.getRow(1);
    he.font = { bold: true, color: { argb: 'FFFFFF' } };
    he.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    he.alignment = { vertical: 'middle', horizontal: 'center' };
    empleadosBiometrico.filter((u: any) => u.activo !== false).forEach((u: any) => {
      hojaEmpleados.addRow({ employeeId: u.employeeNo, nombre: u.name });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="plantilla_asignaciones_${año}-${String(mesNum + 1).padStart(2, '0')}.xlsx"`,
    });
  }

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