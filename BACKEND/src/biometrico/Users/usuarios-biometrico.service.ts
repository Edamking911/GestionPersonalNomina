import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Workbook } from 'exceljs';
import { BiometricDeviceProvider } from '../Providers/biometrico-device.provider';
import { delay } from '../Utils/Events-types.util';
import { Empleado } from 'src/Entitys/Empleados/Empleado.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { normalizarCedula } from 'src/utils/formato_horas.util';

@Injectable()
export class UsuariosBiometricoService {
  private readonly logger = new Logger(UsuariosBiometricoService.name);
  private readonly pendingPath = path.join(
    process.cwd(),
    'pendientes_huella.json',
  );

  constructor(
    private readonly deviceProvider: BiometricDeviceProvider,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  async listUsers(incluirInactivos = false) {
    const usuarios = await this.deviceProvider.device.listUsers(incluirInactivos);

    return {
      success: true,
      totalUsuarios: usuarios.length,
      usuarios: usuarios.map((u) => ({
        employeeNo: u.employeeNo,
        name: u.name,
        userType: u.userType,
        userGroup: u.userGroup || '',
        activo: u.activo,
      })),
    };
  }

  async importUsersFromExcel(excelPath: string) {
    const workbook: any = new Workbook();
    try {
      await workbook.xlsx.readFile(excelPath);
      const worksheet: any = workbook.getWorksheet(1);
      if (!worksheet) throw new Error('No se encontró la hoja en el Excel');

      this.logger.log(`📄 Leyendo usuarios desde: ${excelPath}`);

      const resultados = {
        totalFilas: 0,
        creados: 0,
        actualizados: 0,
        fallidos: 0,
        errores: [] as string[],
      };

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);

        let cedula = row.getCell(1).value?.toString().trim() || '';
        cedula = cedula.replace(/[^0-9]/g, '');

        const nombreRaw = row.getCell(2).value?.toString().trim() || '';
        const apellidoRaw = row.getCell(3).value?.toString().trim() || '';
        const cargo = row.getCell(4).value?.toString().trim() || 'EMPLEADO';

        const nombre = nombreRaw.replace(/\s+/g, ' ').trim();
        const apellido = apellidoRaw.replace(/\s+/g, ' ').trim();

        if (!cedula) continue;

        let nombreCompleto: string;
        if (nombre && apellido) nombreCompleto = `${nombre} ${apellido}`;
        else if (nombre) nombreCompleto = nombre;
        else if (apellido) nombreCompleto = apellido;
        else nombreCompleto = `EMPLEADO ${cedula}`;

        nombreCompleto = nombreCompleto.replace(/\s+/g, ' ').trim().slice(0, 32);

        resultados.totalFilas++;

        const existente = await this.deviceProvider.device.getUser(cedula);

        try {
          const result = await this.deviceProvider.device.upsertUser({
            employeeNo: cedula,
            name: nombreCompleto,
            userType: cargo.toLowerCase().includes('admin') ? 'admin' : 'normal',
            userGroup: cargo,
          });

          if (result.success) {
            if (existente) {
              resultados.actualizados++;
              this.logger.log(`🔄 Usuario actualizado: ${cedula} - ${nombreCompleto} (${cargo})`);
            } else {
              resultados.creados++;
              this.logger.log(`✅ Usuario creado: ${cedula} - ${nombreCompleto} (${cargo})`);
            }
          } else {
            resultados.fallidos++;
            resultados.errores.push(`Error con ${cedula}: ${JSON.stringify(result.raw)}`);
          }
        } catch (error: any) {
          resultados.fallidos++;
          resultados.errores.push(`Error con ${cedula}: ${error.message}`);
        }

        await delay(200);
      }

      this.deviceProvider.device.clearEmployeeCache();

      return {
        success: true,
        message: 'Importación masiva completada',
        ...resultados,
      };
    } catch (error: any) {
      this.logger.error('Error en importación masiva:', error.message);
      return {
        success: false,
        message: 'Error al importar usuarios',
        error: error.message,
      };
    }
  }

  // =========================================================
  // 🔴 DESACTIVAR USUARIO (biométrico + BD)
  // =========================================================
  async deleteUser(employeeNo: string) {
    try {
      const currentUser = await this.deviceProvider.device.getUser(employeeNo);
      if (!currentUser) {
        return {
          success: false,
          message: `El usuario ${employeeNo} no existe en el biométrico`,
        };
      }

      // 1. Desactivar en el biométrico
      const result = await this.deviceProvider.device.deactivateUser(employeeNo);

      if (!result.success) {
        this.logger.warn(
          `⚠️ No se pudo desactivar ${employeeNo} en el biométrico: ${JSON.stringify(result.raw)}`,
        );
        return {
          success: false,
          message: 'No se pudo desactivar el usuario en el biométrico',
          detail: result.raw,
        };
      }

      // 2. ✅ Actualizar BD (empleado.estado = INACTIVO)
      const cedulaNorm = normalizarCedula(employeeNo);
      const empleado = await this.empleadoRepo.findOne({
        where: { cedula: cedulaNorm },
      });

      let bdActualizada = false;
      if (empleado) {
        empleado.estado = 'INACTIVO';
        await this.empleadoRepo.save(empleado);
        bdActualizada = true;
        this.logger.log(
          `🔴 Usuario ${employeeNo} (${empleado.nombre} ${empleado.apellido}) DESACTIVADO en biométrico + BD`,
        );
      } else {
        this.logger.warn(
          `⚠️ Empleado ${employeeNo} no existe en BD. Solo se desactivó en biométrico.`,
        );
      }

      this.deviceProvider.device.clearEmployeeCache();

      return {
        success: true,
        message: `Usuario ${employeeNo} (${currentUser.name}) desactivado${bdActualizada ? ' + BD actualizada' : ''}`,
        bdActualizada,
      };
    } catch (error: any) {
      this.logger.error(`Error desactivando ${employeeNo}: ${error.message}`);
      return {
        success: false,
        message: 'Error al desactivar el usuario',
        error: error.message,
      };
    }
  }

  // =========================================================
  // 🟢 ACTIVAR USUARIO (biométrico + BD)
  // =========================================================
  async activateUser(employeeNo: string) {
    try {
      const currentUser = await this.deviceProvider.device.getUser(employeeNo);
      if (!currentUser) {
        return {
          success: false,
          message: `El usuario ${employeeNo} no existe en el biométrico`,
        };
      }

      // 1. Activar en el biométrico
      const result = await this.deviceProvider.device.activateUser(employeeNo);

      if (!result.success) {
        this.logger.warn(
          `⚠️ No se pudo activar ${employeeNo} en el biométrico: ${JSON.stringify(result.raw)}`,
        );
        return {
          success: false,
          message: 'No se pudo activar el usuario en el biométrico',
          detail: result.raw,
        };
      }

      // 2. ✅ Actualizar BD (empleado.estado = ACTIVO)
      const cedulaNorm = normalizarCedula(employeeNo);
      const empleado = await this.empleadoRepo.findOne({
        where: { cedula: cedulaNorm },
      });

      let bdActualizada = false;
      if (empleado) {
        empleado.estado = 'ACTIVO';
        await this.empleadoRepo.save(empleado);
        bdActualizada = true;
        this.logger.log(
          `🟢 Usuario ${employeeNo} (${empleado.nombre} ${empleado.apellido}) ACTIVADO en biométrico + BD`,
        );
      } else {
        this.logger.warn(
          `⚠️ Empleado ${employeeNo} no existe en BD. Solo se activó en biométrico.`,
        );
      }

      this.deviceProvider.device.clearEmployeeCache();

      return {
        success: true,
        message: `Usuario ${employeeNo} (${currentUser.name}) activado. Ya puede marcar.`,
        usuario: {
          employeeNo,
          nombre: currentUser.name,
          activo: true,
        },
        bdActualizada,
      };
    } catch (error: any) {
      this.logger.error(`Error activando ${employeeNo}: ${error.message}`);
      return {
        success: false,
        message: 'Error al activar el usuario',
        error: error.message,
      };
    }
  }

  async prepareForFingerprint(employeeNo: string) {
    try {
      const currentUser = await this.deviceProvider.device.getUser(employeeNo);
      if (!currentUser) {
        return {
          success: false,
          message: 'Usuario no encontrado en el biométrico',
        };
      }

      const result = await this.deviceProvider.device.activateUser(employeeNo);

      if (result.success) {
        this.addToPendingList(employeeNo);
        return {
          success: true,
          message: `Usuario ${employeeNo} (${currentUser.name}) listo para registrar huella`,
        };
      }

      return {
        success: false,
        message: 'No se pudo preparar al usuario',
        detail: result.raw,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error al preparar usuario',
        error: error.message,
      };
    }
  }

  listPendingFingerprint(): string[] {
    if (!fs.existsSync(this.pendingPath)) return [];
    return JSON.parse(fs.readFileSync(this.pendingPath, 'utf-8'));
  }

  removeFromPendingList(employeeNo: string) {
    if (!fs.existsSync(this.pendingPath)) {
      return { success: true, message: 'No hay pendientes' };
    }
    const pendientes = JSON.parse(fs.readFileSync(this.pendingPath, 'utf-8'));
    const nuevos = pendientes.filter((p: string) => p !== employeeNo);
    fs.writeFileSync(this.pendingPath, JSON.stringify(nuevos, null, 2));
    return {
      success: true,
      message: `Usuario ${employeeNo} eliminado de pendientes`,
    };
  }

  private addToPendingList(employeeNo: string) {
    let pendientes: string[] = [];
    if (fs.existsSync(this.pendingPath)) {
      pendientes = JSON.parse(fs.readFileSync(this.pendingPath, 'utf-8'));
    }
    if (!pendientes.includes(employeeNo)) {
      pendientes.push(employeeNo);
      fs.writeFileSync(this.pendingPath, JSON.stringify(pendientes, null, 2));
    }
  }
}