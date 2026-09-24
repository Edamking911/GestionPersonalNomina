import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { NovedadNomina } from '../../Entitys/Novedades/NovedadNomina.entity';
import { Empleado } from '../../Entitys/Empleados/Empleado.entity';
import { NovedadesReporteService } from './novedades-reporte.service';
import { normalizarCedula } from '../Utils/tiempo.util';

@Injectable()
export class NovedadesPdfService {
  constructor(
    @InjectRepository(NovedadNomina)
    private readonly novedadRepo: Repository<NovedadNomina>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
    private readonly reporteService: NovedadesReporteService,
  ) {}

  // =========================================================
  // CONSTANCIA PDF DE UNA NOVEDAD
  // =========================================================
  async constanciaPDF(id: string): Promise<StreamableFile> {
    const novedad = await this.novedadRepo.findOne({
      where: { id },
      relations: { empleado: true },
    });

    if (!novedad) throw new NotFoundException(`Novedad ${id} no encontrada`);

    const buffer = await this.generarConstanciaBuffer(novedad);

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="constancia_${novedad.tipo}_${novedad.cedula}.pdf"`,
    });
  }

  // =========================================================
  // REPORTE PDF POR EMPLEADO
  // =========================================================
  async reporteEmpleadoPDF(
    cedula: string,
    desde?: string,
    hasta?: string,
  ): Promise<StreamableFile> {
    const reporte = await this.reporteService.reportePorEmpleado(
      cedula,
      desde,
      hasta,
    );

    const buffer = await this.generarReporteEmpleadoBuffer(reporte);

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="reporte_novedades_${normalizarCedula(cedula)}.pdf"`,
    });
  }

  // =========================================================
  // GENERADOR: CONSTANCIA
  // =========================================================
  private generarConstanciaBuffer(novedad: NovedadNomina): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'LETTER', margin: 60 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ========== HEADER ==========
        doc
          .fontSize(22)
          .fillColor('#004080')
          .text('CONSTANCIA DE NOVEDAD', { align: 'center' });

        doc.moveDown(0.3);
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text('Sistema de Control de Asistencia Biométrico', { align: 'center' });

        doc.moveDown(1.5);

        // Línea divisoria
        doc
          .strokeColor('#004080')
          .lineWidth(2)
          .moveTo(60, doc.y)
          .lineTo(doc.page.width - 60, doc.y)
          .stroke();
        doc.moveDown(1);

        // ========== DATOS EMPLEADO ==========
        doc.fontSize(13).fillColor('#004080').text('DATOS DEL EMPLEADO');
        doc.moveDown(0.5);

        const empleadoNombre = novedad.empleado
          ? `${novedad.empleado.nombre} ${novedad.empleado.apellido}`.trim()
          : 'N/D';

        doc.fontSize(11).fillColor('#000000');
        doc.text(`Cédula:   ${novedad.cedula}`);
        doc.text(`Nombre:   ${empleadoNombre}`);
        doc.moveDown(1);

        // ========== DATOS DE LA NOVEDAD ==========
        doc.fontSize(13).fillColor('#004080').text('DATOS DE LA NOVEDAD');
        doc.moveDown(0.5);

        const dias = this.contarDias(novedad.fechaInicio, novedad.fechaFin);

        doc.fontSize(11).fillColor('#000000');
        doc.text(`Tipo:         ${this.tipoLegible(novedad.tipo)}`);
        doc.text(`Desde:        ${this.formatearFecha(novedad.fechaInicio)}`);
        doc.text(`Hasta:        ${this.formatearFecha(novedad.fechaFin)}`);
        doc.text(`Días:         ${dias} día(s)`);

        if (novedad.motivo) {
          doc.text(`Motivo:       ${novedad.motivo}`);
        }

        if (novedad.documentoSoporte) {
          doc.text(`Soporte:      ${novedad.documentoSoporte}`);
        }

        doc.moveDown(3);

        // ========== FIRMAS ==========
        const firmaY = doc.y;
        const firmaAncho = 200;
        const espacio = 60;
        const margenIzq = 60;
        const margenDer = doc.page.width - 60 - firmaAncho;

        doc.fontSize(11).fillColor('#000000');

        // Firma empleado (izquierda)
        doc.text('_________________________', margenIzq, firmaY);
        doc.fontSize(9).text('Firma del Empleado', margenIzq, firmaY + 15);
        doc.text(`C.I. ${novedad.cedula}`, margenIzq, firmaY + 30);

        // Firma RRHH (derecha)
        doc.fontSize(11).text('_________________________', margenDer, firmaY);
        doc.fontSize(9).text('Firma RRHH', margenDer, firmaY + 15);

        // ========== FOOTER ==========
        doc.fontSize(8).fillColor('#888888');
        const footY = doc.page.height - 50;
        doc.text(
          `Generado el ${new Date().toLocaleString('es-VE')}`,
          60,
          footY,
          { align: 'center', width: doc.page.width - 120 },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // =========================================================
  // GENERADOR: REPORTE POR EMPLEADO
  // =========================================================
  private generarReporteEmpleadoBuffer(reporte: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ========== HEADER ==========
        doc
          .fontSize(20)
          .fillColor('#004080')
          .text('REPORTE DE NOVEDADES', { align: 'center' });

        doc.moveDown(0.3);
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text('Sistema de Control de Asistencia Biométrico', { align: 'center' });

        doc.moveDown(1);

        doc
          .strokeColor('#004080')
          .lineWidth(2)
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke();
        doc.moveDown(1);

        // ========== DATOS EMPLEADO ==========
        doc.fontSize(12).fillColor('#004080').text('EMPLEADO');
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#000000');
        doc.text(`Cédula: ${reporte.empleado.cedula}`);
        doc.text(`Nombre: ${reporte.empleado.nombre}`);
        doc.text(`Estado: ${reporte.empleado.estado}`);
        doc.moveDown(0.5);
        doc.text(`Rango: ${reporte.rango.desde} → ${reporte.rango.hasta}`);
        doc.moveDown(1);

        // ========== RESUMEN ==========
        doc.fontSize(12).fillColor('#004080').text('RESUMEN');
        doc.moveDown(0.3);

        const resumen = reporte.resumen;
        doc.fontSize(10).fillColor('#000000');
        doc.text(`Total novedades: ${resumen.totalNovedades}`);
        doc.text(`Total días: ${resumen.totalDias}`);
        doc.moveDown(0.3);

        if (resumen.VACACIONES > 0) doc.text(`• Vacaciones: ${resumen.VACACIONES} días`);
        if (resumen.REPOSO_MEDICO > 0) doc.text(`• Reposo Médico: ${resumen.REPOSO_MEDICO} días`);
        if (resumen.PERMISO_REMUNERADO > 0) doc.text(`• Permiso Remunerado: ${resumen.PERMISO_REMUNERADO} días`);
        if (resumen.PERMISO_NO_REMUNERADO > 0) doc.text(`• Permiso No Remunerado: ${resumen.PERMISO_NO_REMUNERADO} días`);
        if (resumen.FALTA_JUSTIFICADA > 0) doc.text(`• Falta Justificada: ${resumen.FALTA_JUSTIFICADA} días`);
        if (resumen.FALTA_INJUSTIFICADA > 0) doc.text(`• Falta Injustificada: ${resumen.FALTA_INJUSTIFICADA} días`);

        doc.moveDown(1.5);

        // ========== TABLA DETALLE ==========
        doc.fontSize(12).fillColor('#004080').text('DETALLE DE NOVEDADES');
        doc.moveDown(0.5);

        if (reporte.novedades.length === 0) {
          doc.fontSize(10).fillColor('#999999').text('Sin novedades en el rango.');
        } else {
          // Header de tabla
          const colX = [50, 140, 260, 340, 400, 460];
          const colW = [85, 115, 75, 55, 55, 60];
          const startY = doc.y;

          // Fondo header
          doc
            .rect(50, startY - 5, doc.page.width - 100, 20)
            .fillColor('#004080')
            .fill();

          doc.fillColor('#FFFFFF').fontSize(9);
          doc.text('Tipo', colX[0], startY, { width: colW[0] });
          doc.text('Desde', colX[1], startY, { width: colW[1] });
          doc.text('Hasta', colX[2], startY, { width: colW[2] });
          doc.text('Días', colX[3], startY, { width: colW[3], align: 'center' });
          doc.text('Motivo', colX[4], startY, { width: 180 });

          doc.fillColor('#000000');
          let y = startY + 22;

          for (const n of reporte.novedades) {
            if (y > doc.page.height - 80) {
              doc.addPage();
              y = 50;
            }

            doc.fontSize(9);
            doc.text(this.acortar(n.tipoLegible, 22), colX[0], y, { width: colW[0] });
            doc.text(n.fechaInicio, colX[1], y, { width: colW[1] });
            doc.text(n.fechaFin, colX[2], y, { width: colW[2] });
            doc.text(String(n.dias), colX[3], y, { width: colW[3], align: 'center' });
            doc.text(this.acortar(n.motivo || '-', 30), colX[4], y, { width: 180 });

            // Línea separadora
            doc
              .strokeColor('#DDDDDD')
              .lineWidth(0.5)
              .moveTo(50, y + 14)
              .lineTo(doc.page.width - 50, y + 14)
              .stroke();

            y += 18;
          }
        }

        // ========== FOOTER ==========
        doc.fontSize(8).fillColor('#888888');
        const footY = doc.page.height - 40;
        doc.text(
          `Generado el ${new Date().toLocaleString('es-VE')}`,
          50,
          footY,
          { align: 'center', width: doc.page.width - 100 },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // =========================================================
  // HELPERS
  // =========================================================
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

  private acortar(texto: string, max: number): string {
    if (!texto) return '';
    return texto.length > max ? texto.slice(0, max - 1) + '…' : texto;
  }
}