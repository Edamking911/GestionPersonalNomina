import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from 'exceljs';
import { Cargo } from '../Entitys/Cargos/Cargos.entity';
import { EmpleadosService } from './empleados.service';
import { CreateEmpleadoDto } from '../DTOS/Empleados/Create-Empleado.dto';

@Injectable()
export class EmpleadosExcelService {
  private readonly logger = new Logger(EmpleadosExcelService.name);

  constructor(
    @InjectRepository(Cargo)
    private readonly cargoRepository: Repository<Cargo>,
    private readonly empleadosService: EmpleadosService,
  ) {}

  // =========================================================
  // 📄 GENERAR PLANTILLA EXCEL
  // =========================================================
  async generarPlantillaEmpleados(): Promise<StreamableFile> {
    const workbook: any = new Workbook();

    // ============ Hoja Empleados ============
    const hoja: any = workbook.addWorksheet('Empleados');

    hoja.columns = [
      { header: 'Cédula *', key: 'cedula', width: 15 },
      { header: 'Nombre *', key: 'nombre', width: 20 },
      { header: 'Apellido *', key: 'apellido', width: 20 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Teléfono', key: 'telefono', width: 18 },
      { header: 'Fecha Ingreso (YYYY-MM-DD)', key: 'fechaIngreso', width: 26 },
      { header: 'Cargo', key: 'cargo', width: 25 },
      { header: 'Estado', key: 'estado', width: 15 },
    ];

    const headerRow = hoja.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '004080' },
    };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    headerRow.height = 32;

    // ============ Hoja Cargos Válidos ============
    const hojaCargos: any = workbook.addWorksheet('Cargos Válidos');
    hojaCargos.columns = [{ header: 'Cargo', key: 'nombre', width: 30 }];

    const hc = hojaCargos.getRow(1);
    hc.font = { bold: true, color: { argb: 'FFFFFF' } };
    hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    hc.alignment = { vertical: 'middle', horizontal: 'center' };

    const cargos = await this.cargoRepository.find({ order: { nombre: 'ASC' } });
    for (const c of cargos) {
      hojaCargos.addRow({ nombre: c.nombre });
    }

    // ============ Hoja Instrucciones ============
    const hojaInstrucciones: any = workbook.addWorksheet('Instrucciones');
    hojaInstrucciones.columns = [
      { header: 'Campo', key: 'campo', width: 30 },
      { header: 'Descripción', key: 'descripcion', width: 80 },
    ];
    const hi = hojaInstrucciones.getRow(1);
    hi.font = { bold: true, color: { argb: 'FFFFFF' } };
    hi.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    hi.alignment = { vertical: 'middle', horizontal: 'center' };

    hojaInstrucciones.addRows([
      { campo: '📋 CAMPOS OBLIGATORIOS (*)', descripcion: '' },
      { campo: 'Cédula *', descripcion: 'Solo números. Ej: 22652518. NO usar V-, E-, etc.' },
      { campo: 'Nombre *', descripcion: 'Máximo 100 caracteres.' },
      { campo: 'Apellido *', descripcion: 'Máximo 100 caracteres.' },
      { campo: '', descripcion: '' },
      { campo: '📋 CAMPOS OPCIONALES', descripcion: 'Dejar vacío si no aplica' },
      { campo: 'Email', descripcion: 'Único. Ej: juan@empresa.com' },
      { campo: 'Teléfono', descripcion: 'Máximo 20 caracteres. Ej: 04141234567' },
      { campo: 'Fecha Ingreso', descripcion: 'Formato YYYY-MM-DD. SI SE DEJA VACÍO usa la fecha actual.' },
      { campo: 'Cargo', descripcion: 'Debe existir en la hoja "Cargos Válidos"' },
      { campo: 'Estado', descripcion: 'ACTIVO (default), INACTIVO o SUSPENDIDO' },
      { campo: '', descripcion: '' },
      { campo: '⚠️ IMPORTANTE', descripcion: 'No modificar los nombres de las hojas ni el orden de las columnas.' },
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="plantilla_empleados_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    });
  }

  // =========================================================
  // ✅ VALIDAR EXCEL (sin importar)
  // =========================================================
  async validarExcelEmpleados(buffer: Buffer) {
    const workbook: any = new Workbook();
    await workbook.xlsx.load(buffer as any);

    const hoja: any = workbook.getWorksheet('Empleados');
    if (!hoja) {
      return {
        success: false,
        message: 'No se encontró la hoja "Empleados" en el Excel',
        errores: [],
        preview: [],
      };
    }

    // ✅ Reutilizamos el service para obtener los cargos válidos
    const cargos = await this.cargoRepository.find();
    const cargosValidos = new Map(
      cargos.map((c) => [c.nombre.toLowerCase().trim(), c]),
    );

    // ✅ Reutilizamos el service para obtener empleados existentes
    const empleadosExistentes =
      await this.empleadosService.Obtener_Empleados_Todos();

    const cedulasExistentes = new Set(empleadosExistentes.map((e) => e.cedula));
    const emailsExistentes = new Set(
      empleadosExistentes
        .filter((e) => e.email)
        .map((e) => e.email!.toLowerCase().trim()),
    );

    const estadosValidos = new Set(['ACTIVO', 'INACTIVO', 'SUSPENDIDO']);

    const errores: any[] = [];
    const preview: any[] = [];
    const cedulasVistas = new Set<string>();
    const emailsVistos = new Set<string>();
    let totalFilas = 0;

    hoja.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return;

      const cedulaRaw = String(row.getCell(1).value || '').trim();
      if (!cedulaRaw) return; // fila vacía

      totalFilas++;

      const cedulaLimpia = cedulaRaw.replace(/[^0-9]/g, '');
      const nombre = String(row.getCell(2).value || '').trim();
      const apellido = String(row.getCell(3).value || '').trim();
      const email = String(row.getCell(4).value || '').trim().toLowerCase();
      const telefono = String(row.getCell(5).value || '').trim();
      const fechaIngresoRaw = row.getCell(6).value;
      const cargoNombre = String(row.getCell(7).value || '').trim();
      const estadoRaw = String(row.getCell(8).value || 'ACTIVO')
        .trim()
        .toUpperCase();

      // ============ Validar Cédula ============
      if (!cedulaLimpia || cedulaLimpia.length < 6 || cedulaLimpia.length > 10) {
        errores.push({
          fila: rowNumber,
          error: `Cédula inválida: "${cedulaRaw}" (debe tener 6-10 dígitos)`,
        });
        return;
      }

      if (cedulasVistas.has(cedulaLimpia)) {
        errores.push({
          fila: rowNumber,
          error: `Cédula ${cedulaLimpia} duplicada en el Excel`,
        });
        return;
      }
      cedulasVistas.add(cedulaLimpia);

      if (cedulasExistentes.has(cedulaLimpia)) {
        errores.push({
          fila: rowNumber,
          error: `Cédula ${cedulaLimpia} ya existe en BD`,
        });
        return;
      }

      // ============ Validar Nombre y Apellido ============
      if (!nombre || nombre.length > 100) {
        errores.push({
          fila: rowNumber,
          error: `Nombre inválido (vacío o >100 caracteres)`,
        });
        return;
      }

      if (!apellido || apellido.length > 100) {
        errores.push({
          fila: rowNumber,
          error: `Apellido inválido (vacío o >100 caracteres)`,
        });
        return;
      }

      // ============ Validar Email ============
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errores.push({
            fila: rowNumber,
            error: `Email inválido: "${email}"`,
          });
          return;
        }

        if (emailsVistos.has(email)) {
          errores.push({
            fila: rowNumber,
            error: `Email ${email} duplicado en el Excel`,
          });
          return;
        }
        emailsVistos.add(email);

        if (emailsExistentes.has(email)) {
          errores.push({
            fila: rowNumber,
            error: `Email ${email} ya existe en BD`,
          });
          return;
        }
      }

      // ============ Validar Teléfono ============
      if (telefono && telefono.length > 20) {
        errores.push({
          fila: rowNumber,
          error: `Teléfono excede 20 caracteres`,
        });
        return;
      }

      // ============ Validar Fecha (opcional → HOY) ============
      let fechaIngresoStr: string | null = null;
      let usaFechaDefault = false;

      if (fechaIngresoRaw) {
        const fechaStr = this.excelFechaAString(fechaIngresoRaw);
        if (!fechaStr) {
          errores.push({
            fila: rowNumber,
            error: `Fecha de ingreso inválida: "${fechaIngresoRaw}" (formato YYYY-MM-DD)`,
          });
          return;
        }
        fechaIngresoStr = fechaStr;
      } else {
        // ✅ Si no viene fecha, usamos HOY
        fechaIngresoStr = this.formatearFecha(new Date());
        usaFechaDefault = true;
      }

      // ============ Validar Cargo ============
      let cargoNombreReal: string | null = null;
      if (cargoNombre) {
        const cargo = cargosValidos.get(cargoNombre.toLowerCase());
        if (!cargo) {
          errores.push({
            fila: rowNumber,
            error: `Cargo "${cargoNombre}" no existe en la BD`,
          });
          return;
        }
        cargoNombreReal = cargo.nombre;
      }

      // ============ Validar Estado ============
      if (!estadosValidos.has(estadoRaw)) {
        errores.push({
          fila: rowNumber,
          error: `Estado "${estadoRaw}" inválido. Use ACTIVO, INACTIVO o SUSPENDIDO`,
        });
        return;
      }

      // ============ Fila Válida → Preview ============
      preview.push({
        fila: rowNumber,
        cedula: cedulaLimpia,
        nombre,
        apellido,
        email: email || null,
        telefono: telefono || null,
        fechaIngreso: fechaIngresoStr,
        usaFechaDefault,
        cargoNombre: cargoNombreReal,
        estado: estadoRaw,
      });
    });

    return {
      success: errores.length === 0,
      totalFilas,
      filasValidas: preview.length,
      filasConError: errores.length,
      errores,
      preview,
    };
  }

  // =========================================================
  // 📥 IMPORTAR EXCEL (REUTILIZA Crear_Empleado del service)
  // =========================================================
  async importarExcelEmpleados(buffer: Buffer) {
    const validacion = await this.validarExcelEmpleados(buffer);

    if (!validacion.success || validacion.errores.length > 0) {
      return {
        success: false,
        message: 'Hay errores en el Excel. Corrígelos y vuelve a intentar.',
        errores: validacion.errores,
      };
    }

    let creados = 0;
    let conFechaDefault = 0;
    const errores: string[] = [];

    for (const fila of validacion.preview) {
      try {
        // ✅ Armar el DTO que espera Crear_Empleado
        const dto: CreateEmpleadoDto = {
          cedula: fila.cedula,
          nombre: fila.nombre,
          apellido: fila.apellido,
          email: fila.email || undefined,
          telefono: fila.telefono || undefined,
          fechaIngreso: fila.fechaIngreso || undefined,
          estado: fila.estado,
        };

        // ✅ Reutilizamos el método Crear_Empleado del service
        // El primer argumento es el NOMBRE DEL CARGO (viene de la URL normalmente)
        const nombreCargo = fila.cargoNombre || '';
        await this.empleadosService.Crear_Empleado(nombreCargo, dto);

        creados++;
        if (fila.usaFechaDefault) conFechaDefault++;
      } catch (error: any) {
        errores.push(`Cédula ${fila.cedula}: ${error.message}`);
      }
    }

    this.logger.log(
      `📥 ${creados} empleados importados (${conFechaDefault} con fecha default)`,
    );

    return {
      success: true,
      message: `Excel importado: ${creados} empleados creados${
        conFechaDefault > 0
          ? ` (${conFechaDefault} con fecha actual por defecto)`
          : ''
      }`,
      creados,
      conFechaDefault,
      errores,
    };
  }

  // =========================================================
  // HELPERS
  // =========================================================

  /**
   * Convierte el valor de la celda de Excel a string 'YYYY-MM-DD'
   * Acepta:
   *   - string 'YYYY-MM-DD'
   *   - objeto Date (Excel lo interpreta así)
   */
  private excelFechaAString(valor: any): string | null {
    if (typeof valor === 'string') {
      const match = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) return valor.trim();
      return null;
    }

    if (valor instanceof Date) {
      const y = valor.getUTCFullYear();
      const m = String(valor.getUTCMonth() + 1).padStart(2, '0');
      const d = String(valor.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return null;
  }

  private formatearFecha(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}