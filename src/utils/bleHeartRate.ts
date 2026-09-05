export interface BluetoothHRDevice {
  device: any;
  server: any;
  characteristic: any;
}

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function parseHeartRate(dataView: DataView): {
  bpm: number;
  contactDetected?: boolean;
  energyExpended?: number;
  rrIntervals?: number[];
} {
  const flags = dataView.getUint8(0);
  let offset = 1;

  // Bit 0: 0 = 8-bit BPM, 1 = 16-bit BPM
  let bpm = 0;
  if ((flags & 0x01) === 0) {
    bpm = dataView.getUint8(offset);
    offset += 1;
  } else {
    bpm = dataView.getUint16(offset, /* littleEndian */ true);
    offset += 2;
  }

  // Bit 1 & 2: Sensor Contact status
  const contactDetected = (flags & 0x06) === 0x06;

  // Bit 3: Energy Expended Present
  let energyExpended: number | undefined;
  if ((flags & 0x08) !== 0) {
    energyExpended = dataView.getUint16(offset, true);
    offset += 2;
  }

  // Bit 4: RR-Interval values present
  const rrIntervals: number[] = [];
  if ((flags & 0x10) !== 0) {
    while (offset + 1 < dataView.byteLength) {
      const rr = dataView.getUint16(offset, true) / 1024 * 1000; // in ms
      rrIntervals.push(Math.round(rr));
      offset += 2;
    }
  }

  return { bpm, contactDetected, energyExpended, rrIntervals };
}

export async function connectBleHeartRateMonitor(
  onHeartRate: (bpm: number, rrIntervals?: number[]) => void,
  onDisconnect: () => void
): Promise<BluetoothHRDevice> {
  if (!isWebBluetoothSupported()) {
    throw new Error('Web Bluetooth API is not supported in this browser. You can use the high-fidelity Wearable Simulator.');
  }

  const device = await (navigator as any).bluetooth.requestDevice({
    filters: [{ services: ['heart_rate'] }],
    optionalServices: ['battery_service', 'device_information'],
  });

  device.addEventListener('gattserverdisconnected', () => {
    onDisconnect();
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService('heart_rate');
  const characteristic = await service.getCharacteristic('heart_rate_measurement');

  await characteristic.startNotifications();
  characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
    const value = event.target.value;
    const parsed = parseHeartRate(value);
    onHeartRate(parsed.bpm, parsed.rrIntervals);
  });

  return { device, server, characteristic };
}

// Heart rate zone classification (based on standard Karvonen / Max HR formula)
// Assuming standard estimated max HR = 190 (customizable in settings)
export function getHeartRateZone(bpm: number, maxBpm: number = 190): {
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  color: string;
  badgeBg: string;
  description: string;
} {
  const percentage = (bpm / maxBpm) * 100;
  if (percentage < 60) {
    return {
      zone: 1,
      name: 'Zone 1: Active Warmup',
      color: '#3b82f6',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Active recovery, warm-up, and cellular mitochondrial density',
    };
  } else if (percentage < 70) {
    return {
      zone: 2,
      name: 'Zone 2: Aerobic Base & Fat Burn',
      color: '#10b981',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Optimal fat oxidation and cardiovascular mitochondrial endurance',
    };
  } else if (percentage < 80) {
    return {
      zone: 3,
      name: 'Zone 3: Aerobic Tempo',
      color: '#f59e0b',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Cardiovascular efficiency and stamina capacity',
    };
  } else if (percentage < 90) {
    return {
      zone: 4,
      name: 'Zone 4: Anaerobic Threshold',
      color: '#f97316',
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
      description: 'Lactate threshold endurance, high intensity interval power',
    };
  } else {
    return {
      zone: 5,
      name: 'Zone 5: Neuromuscular Max',
      color: '#ef4444',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      description: 'Peak cardiac output, sprint power, and VO2 Max overload',
    };
  }
}
