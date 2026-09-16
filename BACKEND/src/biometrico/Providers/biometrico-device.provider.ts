import { Injectable, Logger } from '@nestjs/common';
import { BiometricDeviceFactory } from '../Factory/Biometrico-device.factory';
import { IBiometricDevice } from '../Interfaces/biometrico-device.interface';

@Injectable()
export class BiometricDeviceProvider {
  private readonly logger = new Logger(BiometricDeviceProvider.name);
  readonly device: IBiometricDevice;

  constructor(factory: BiometricDeviceFactory) {
    this.device = factory.crearDesdeEnv();
    this.logger.log(`🔌 Biométrico único: ${this.device.deviceType}`);
  }
}