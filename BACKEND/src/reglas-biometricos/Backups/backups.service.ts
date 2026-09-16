import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Cron } from '@nestjs/schedule';
import { ReglasConfigService } from '../Configs/reglas-config.service';
import { ReportesService } from '../Reportes/reportes.service';

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups_asignaciones');

  constructor(
    private readonly config: ReglasConfigService,
    private readonly reportes: ReportesService,
  ) {}

  listarBackups() {
    if (!fs.existsSync(this.backupDir)) return { success: true, total: 0, backups: [] };

    const archivos = fs.readdirSync(this.backupDir).filter((f) => f.endsWith('.json'));
    const backups = archivos
      .map((nombre) => {
        const ruta = path.join(this.backupDir, nombre);
        const stats = fs.statSync(ruta);
        return { nombre, ruta, fecha: stats.mtime, tamanoKB: (stats.size / 1024).toFixed(2) };
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    return { success: true, total: backups.length, backups };
  }

  restaurarBackup(nombreArchivo: string) {
    const backupPath = path.join(this.backupDir, nombreArchivo);
    if (!fs.existsSync(backupPath)) {
      return { success: false, message: `No se encontró el backup "${nombreArchivo}"` };
    }

    try {
      const contenido = fs.readFileSync(backupPath, 'utf-8');
      const datos = JSON.parse(contenido);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupActualPath = path.join(this.backupDir, `backup_ANTES_DE_ROLLBACK_${timestamp}.json`);
      fs.writeFileSync(backupActualPath, JSON.stringify(this.config.obtenerSnapshot(), null, 2), 'utf-8');

      this.config.restaurarSnapshot(datos);
      this.reportes.limpiarCaches();

      return {
        success: true,
        message: 'Backup restaurado correctamente',
        backupRestaurado: nombreArchivo,
        backupDelEstadoAnterior: backupActualPath,
        totalAsignaciones: this.config.getAsignaciones().length,
        totalDiasLibres: Object.keys(this.config.getDiasLibres()).length,
      };
    } catch (error: any) {
      return { success: false, message: 'Error al restaurar el backup', error: error.message };
    }
  }

  restaurarUltimoBackup() {
    const lista = this.listarBackups();
    if (!lista.success || lista.total === 0) {
      return { success: false, message: 'No hay backups disponibles' };
    }

    const backupReal = lista.backups.find((b) => !b.nombre.startsWith('backup_ANTES_DE_ROLLBACK_'));
    if (!backupReal) return { success: false, message: 'No hay backups válidos' };

    return this.restaurarBackup(backupReal.nombre);
  }

  limpiarBackupsViejos(diasAntiguedad = 30) {
    if (!fs.existsSync(this.backupDir)) {
      return { success: true, message: 'No hay backups para limpiar', eliminados: 0 };
    }

    const limite = Date.now() - diasAntiguedad * 24 * 60 * 60 * 1000;
    const archivos = fs.readdirSync(this.backupDir).filter((f) => f.endsWith('.json'));
    const eliminados: string[] = [];
    const conservados: string[] = [];

    for (const archivo of archivos) {
      const ruta = path.join(this.backupDir, archivo);
      const stats = fs.statSync(ruta);
      if (stats.mtime.getTime() < limite) {
        try {
          fs.unlinkSync(ruta);
          eliminados.push(archivo);
        } catch (error: any) {
          this.logger.warn(`No se pudo eliminar ${archivo}: ${error.message}`);
        }
      } else {
        conservados.push(archivo);
      }
    }

    return {
      success: true,
      message: `Limpieza: ${eliminados.length} eliminados, ${conservados.length} conservados`,
      diasAntiguedad,
      eliminados: eliminados.length,
      conservados: conservados.length,
      archivosEliminados: eliminados,
    };
  }

  @Cron('0 3 * * *')
  async cronLimpiarBackups() {
    try {
      const resultado = this.limpiarBackupsViejos(30);
      if (resultado.eliminados > 0) {
        this.logger.log(`🧹 Backups: ${resultado.eliminados} eliminados, ${resultado.conservados} conservados`);
      }
    } catch (error: any) {
      this.logger.error(`Error en limpieza de backups: ${error.message}`);
    }
  }
}