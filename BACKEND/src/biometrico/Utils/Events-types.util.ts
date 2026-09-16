export function parseEventType(rawType: string): string {
  const typeMap: Record<string, string> = {
    '1': 'Tarjeta RFID',
    '2': 'Contraseña/PIN',
    '38': 'Huella Dactilar',
    '75': 'Apertura por Software',
    '155': 'Huella Dactilar',
    '160': 'Huella Dactilar',
  };
  return typeMap[rawType] || 'Huella Dactilar';
}

export function parseDeviceTimeToLocal(timeStr: string): {
  dateObj: Date;
  horaLocal: string;
} {
  const clean = timeStr.replace(/[+-]\d{2}:\d{2}$/, '');
  const dateObj = new Date(clean);
  const horaLocal = new Intl.DateTimeFormat('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(dateObj);
  return { dateObj, horaLocal };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}