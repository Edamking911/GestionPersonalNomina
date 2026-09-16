// src/utils/pdfExport.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF con estilo profesional para reportes de asistencia
 *
 * @param {Object} opts
 * @param {string} opts.titulo - Título principal del reporte
 * @param {string} [opts.subtitulo] - Subtítulo o descripción
 * @param {Array<{key:string,label:string,width?:number,align?:string}>} opts.columnas
 * @param {Array<Object>} opts.filas
 * @param {string} [opts.nombreArchivo] - Nombre del PDF (sin .pdf)
 * @param {Object} [opts.metadata] - Info adicional para mostrar bajo el título (ej: { Período: '...' })
 */
export function exportarReportePDF({
  titulo,
  subtitulo,
  columnas,
  filas,
  nombreArchivo = 'reporte',
  metadata = {},
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // =========================================================
  // 1. HEADER
  // =========================================================
  // Banda superior con color de marca
  doc.setFillColor(49, 130, 206); // azul primario
  doc.rect(0, 0, pageWidth, 22, 'F');

  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(titulo, 14, 12);

  // Subtítulo si existe
  if (subtitulo) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(subtitulo, 14, 18);
  }

  // Fecha de generación (arriba a la derecha)
  const fechaHoy = new Date().toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(9);
  doc.text(`Generado: ${fechaHoy}`, pageWidth - 14, 12, { align: 'right' });

  // =========================================================
  // 2. METADATA (opcional) - info extra bajo el header
  // =========================================================
  let cursorY = 32;
  const metadataKeys = Object.keys(metadata);

  if (metadataKeys.length > 0) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    metadataKeys.forEach((key, idx) => {
      const texto = `${key}: ${metadata[key]}`;
      doc.text(texto, 14 + idx * 60, cursorY);
    });
    cursorY += 6;
  }

  // =========================================================
  // 3. TABLA
  // =========================================================
  const head = [columnas.map((c) => c.label)];
  const body = filas.map((fila) =>
    columnas.map((c) => {
      const valor = fila[c.key];
      if (valor === null || valor === undefined) return '—';
      return String(valor);
    }),
  );

  autoTable(doc, {
    head,
    body,
    startY: cursorY,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      textColor: [45, 55, 72],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [45, 55, 72], // gris oscuro
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [247, 250, 252], // gris muy claro para filas alternas
    },
    columnStyles: columnas.reduce((acc, c, idx) => {
      acc[idx] = {
        cellWidth: c.width || 'auto',
        halign: c.align || 'left',
      };
      return acc;
    }, {}),
    didDrawPage: (data) => {
      // =========================================================
      // 4. FOOTER en cada página
      // =========================================================
      const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
      const totalPages = doc.internal.getNumberOfPages();

      doc.setFontSize(8);
      doc.setTextColor(120, 130, 140);
      doc.setFont(undefined, 'italic');

      // Texto izquierda: nombre del sistema
      doc.text(
        'Sistema Biométrico · Reglas y Asistencia',
        14,
        pageHeight - 8,
      );

      // Texto derecha: número de página
      doc.text(
        `Página ${pageNumber} de ${totalPages}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' },
      );
    },
  });

  // =========================================================
  // 5. GUARDAR
  // =========================================================
  const nombreLimpio = nombreArchivo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`${nombreLimpio}_${fecha}.pdf`);
}

/**
 * 🖨️ Vista print-friendly: abre ventana de impresión con el reporte formateado
 * Reutiliza la misma estructura que el PDF pero con HTML/CSS.
 *
 * @param {Object} opts - Mismos parámetros que exportarReportePDF
 */
export function imprimirReporte({
  titulo,
  subtitulo,
  columnas,
  filas,
  metadata = {},
}) {
  const fechaHoy = new Date().toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const metadataHTML = Object.keys(metadata).length
    ? `
      <div class="meta">
        ${Object.entries(metadata)
          .map(
            ([k, v]) => `<span><strong>${k}:</strong> ${v}</span>`,
          )
          .join('')}
      </div>
    `
    : '';

  const headHTML = columnas.map((c) => `<th>${c.label}</th>`).join('');

  const bodyHTML = filas
    .map(
      (fila) => `
        <tr>
          ${columnas
            .map((c) => {
              const v = fila[c.key];
              const text =
                v === null || v === undefined || v === '' ? '—' : String(v);
              return `<td class="${c.align === 'right' ? 'right' : ''}">${text}</td>`;
            })
            .join('')}
        </tr>
      `,
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>${titulo}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Helvetica', Arial, sans-serif;
          color: #2d3748;
          padding: 20px;
          font-size: 11px;
        }
        .header {
          background: #3182ce;
          color: #fff;
          padding: 16px 20px;
          border-radius: 8px 8px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .header h1 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .header .sub {
          font-size: 11px;
          opacity: 0.9;
        }
        .header .fecha {
          font-size: 10px;
          opacity: 0.9;
          text-align: right;
        }
        .meta {
          background: #f7fafc;
          padding: 10px 20px;
          border: 1px solid #e2e8f0;
          border-top: none;
          display: flex;
          gap: 30px;
          font-size: 11px;
        }
        .meta span strong { color: #2d3748; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          border: 1px solid #e2e8f0;
        }
        thead {
          background: #2d3748;
          color: #fff;
        }
        th {
          padding: 8px 10px;
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          font-weight: 700;
          border: 1px solid #2d3748;
        }
        td {
          padding: 7px 10px;
          font-size: 10px;
          border: 1px solid #e2e8f0;
        }
        tbody tr:nth-child(even) {
          background: #f7fafc;
        }
        .right { text-align: right; }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 9px;
          color: #718096;
          font-style: italic;
        }
        @media print {
          body { padding: 0; }
          .header {
            background: #3182ce !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          thead {
            background: #2d3748 !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tbody tr:nth-child(even) {
            background: #f7fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${titulo}</h1>
          ${subtitulo ? `<div class="sub">${subtitulo}</div>` : ''}
        </div>
        <div class="fecha">
          Generado<br />${fechaHoy}
        </div>
      </div>
      ${metadataHTML}
      <table>
        <thead><tr>${headHTML}</tr></thead>
        <tbody>${bodyHTML}</tbody>
      </table>
      <div class="footer">
        Sistema Biométrico · Reglas y Asistencia
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 500);
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  const ventana = window.open('', '_blank', 'width=1200,height=800');
  ventana.document.write(html);
  ventana.document.close();
}