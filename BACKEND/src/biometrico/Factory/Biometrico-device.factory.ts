import { Injectable, Logger } from '@nestjs/common';
import {
  IBiometricDevice,
  DeviceConfig,
} from '../Interfaces/biometrico-device.interface';
import { HikvisionAdapter } from '../Adaptadores/Hikvision.adapter';

@Injectable()
export class BiometricDeviceFactory {
  private readonly logger = new Logger(BiometricDeviceFactory.name);

  crear(config: DeviceConfig): IBiometricDevice {
    this.logger.log(
      `🔌 Creando adaptador: ${config.tipo}${config.ip ? ` @ ${config.ip}` : ''}`,
    );

    switch (config.tipo) {
      case 'hikvision':
        return new HikvisionAdapter(config);

      // 🔮 Futuro: solo descomentar cuando existan
      // case 'zkteco':
      //   return new ZKTecoAdapter(config);

      // case 'dahua':
      //   return new DahuaAdapter(config);

      // case 'manual':
      //   return new ManualAdapter(config);

      default:
        throw new Error(`Tipo de biométrico no soportado: ${config.tipo}`);
    }
  }

  /**
   * Lee la config desde variables de entorno.
   * Cambiando BIO_TYPE en el .env cambias de marca sin tocar código.
   */
  crearDesdeEnv(): IBiometricDevice {
    const tipo = (process.env.BIO_TYPE || 'hikvision') as DeviceConfig['tipo'];

    return this.crear({
        tipo,
        ip: process.env.BIO_IP || '172.18.0.89',
        user: process.env.BIO_USER || 'admin',
        pass: process.env.BIO_PASS || 'Dtd2026*',
        timezone: process.env.BIO_TZ || '+08:00',
    });
  }
}