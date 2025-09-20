interface DeviceCapability {
  type: 'input' | 'output' | 'storage' | 'sensor';
  name: string;
  description: string;
  supported: boolean;
}

interface ConnectedDevice {
  id: string;
  name: string;
  type: 'smartphone' | 'tablet' | 'smartwatch' | 'smart_speaker' | 'stylus' | 'keyboard' | 'other';
  capabilities: DeviceCapability[];
  status: 'connected' | 'disconnected' | 'syncing';
  lastSyncTime?: Date;
  battery?: number;
}

interface SyncData {
  notes: any[];
  projects: any[];
  quickNotes: any[];
  preferences: any;
  timestamp: number;
}

interface SmartPenData {
  strokes: Array<{
    x: number;
    y: number;
    pressure: number;
    timestamp: number;
  }>;
  page: number;
  session: string;
}

class SmartDeviceConnectivityService {
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private onDeviceConnectedCallback?: (device: ConnectedDevice) => void;
  private onDeviceDisconnectedCallback?: (deviceId: string) => void;
  private onDataReceivedCallback?: (deviceId: string, data: any) => void;
  private webSocketConnection?: WebSocket;
  private bluetoothAdapter?: any;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.initializeWebBluetooth();
      await this.initializeWebUSB();
      await this.initializeWebNFC();
      await this.initializeWebSocket();
      this.setupDeviceDetection();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize smart device connectivity:', error);
    }
  }

  private async initializeWebBluetooth(): Promise<void> {
    if ('bluetooth' in navigator) {
      try {
        this.bluetoothAdapter = navigator.bluetooth;
        console.log('Web Bluetooth initialized');
      } catch (error) {
        console.warn('Web Bluetooth not available:', error);
      }
    }
  }

  private async initializeWebUSB(): Promise<void> {
    if ('usb' in navigator) {
      try {
        (navigator as any).usb.addEventListener('connect', this.handleUSBConnect.bind(this));
        (navigator as any).usb.addEventListener('disconnect', this.handleUSBDisconnect.bind(this));
        console.log('Web USB initialized');
      } catch (error) {
        console.warn('Web USB not available:', error);
      }
    }
  }

  private async initializeWebNFC(): Promise<void> {
    if ('NDEFReader' in window) {
      try {
        const ndefReader = new (window as any).NDEFReader();
        await ndefReader.scan();
        ndefReader.addEventListener('reading', this.handleNFCReading.bind(this));
        console.log('Web NFC initialized');
      } catch (error) {
        console.warn('Web NFC not available:', error);
      }
    }
  }

  private async initializeWebSocket(): Promise<void> {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/device-sync';
      this.webSocketConnection = new WebSocket(wsUrl);
      
      this.webSocketConnection.onopen = () => {
        console.log('Device sync WebSocket connected');
      };
      
      this.webSocketConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.webSocketConnection.onclose = () => {
        console.log('Device sync WebSocket disconnected');
        setTimeout(() => this.initializeWebSocket(), 5000); // Reconnect after 5 seconds
      };
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
    }
  }

  private setupDeviceDetection(): void {
    // Check for existing devices through various APIs
    this.detectSmartPens();
    this.detectStylusDevices();
    this.detectWearableDevices();
    this.detectMobileCompanionApps();
  }

  // Smart Pen Integration
  private async detectSmartPens(): Promise<void> {
    // Check for Wacom, Livescribe, Neo Smartpen, etc.
    if ('bluetooth' in navigator) {
      try {
        const devices = await this.bluetoothAdapter.getDevices();
        for (const device of devices) {
          if (this.isSmartPen(device)) {
            await this.connectSmartPen(device);
          }
        }
      } catch (error) {
        console.warn('Smart pen detection failed:', error);
      }
    }
  }

  private isSmartPen(device: any): boolean {
    const smartPenNames = [
      'livescribe', 'wacom', 'neo smartpen', 'moleskine',
      'rocketbook', 'iskn slate', 'apple pencil'
    ];
    
    return smartPenNames.some(name => 
      device.name?.toLowerCase().includes(name) ||
      device.id?.toLowerCase().includes(name)
    );
  }

  private async connectSmartPen(device: any): Promise<void> {
    try {
      const connectedDevice: ConnectedDevice = {
        id: device.id,
        name: device.name || 'Smart Pen',
        type: 'stylus',
        capabilities: [
          { type: 'input', name: 'handwriting', description: 'Handwriting capture', supported: true },
          { type: 'input', name: 'drawing', description: 'Drawing capture', supported: true },
          { type: 'sensor', name: 'pressure', description: 'Pressure sensitivity', supported: true }
        ],
        status: 'connected',
        lastSyncTime: new Date()
      };

      this.connectedDevices.set(device.id, connectedDevice);
      this.onDeviceConnectedCallback?.(connectedDevice);

      // Set up data listeners
      device.addEventListener('characteristicvaluechanged', (event: any) => {
        this.handleSmartPenData(device.id, event.target.value);
      });
    } catch (error) {
      console.error('Failed to connect smart pen:', error);
    }
  }

  private handleSmartPenData(deviceId: string, data: DataView): void {
    try {
      // Parse smart pen data (this would be device-specific)
      const penData: SmartPenData = {
        strokes: this.parseStrokeData(data),
        page: data.getUint8(0),
        session: deviceId + '-' + Date.now()
      };

      this.onDataReceivedCallback?.(deviceId, penData);
    } catch (error) {
      console.error('Failed to parse smart pen data:', error);
    }
  }

  private parseStrokeData(data: DataView): SmartPenData['strokes'] {
    const strokes = [];
    for (let i = 1; i < data.byteLength; i += 8) {
      if (i + 7 < data.byteLength) {
        strokes.push({
          x: data.getUint16(i),
          y: data.getUint16(i + 2),
          pressure: data.getUint16(i + 4),
          timestamp: data.getUint16(i + 6)
        });
      }
    }
    return strokes;
  }

  // Stylus Device Integration
  private async detectStylusDevices(): Promise<void> {
    // Check for pressure-sensitive stylus through Pointer Events
    document.addEventListener('pointerdown', this.handleStylusInput.bind(this));
    document.addEventListener('pointermove', this.handleStylusInput.bind(this));
    document.addEventListener('pointerup', this.handleStylusInput.bind(this));
  }

  private handleStylusInput(event: PointerEvent): void {
    if (event.pointerType === 'pen') {
      const stylusData = {
        x: event.clientX,
        y: event.clientY,
        pressure: event.pressure,
        tiltX: event.tiltX,
        tiltY: event.tiltY,
        twist: (event as any).twist || 0,
        timestamp: Date.now()
      };

      this.onDataReceivedCallback?.('stylus-' + event.pointerId, stylusData);
    }
  }

  // Wearable Device Integration
  private async detectWearableDevices(): Promise<void> {
    if ('bluetooth' in navigator) {
      try {
        const options = {
          filters: [
            { services: ['heart_rate'] },
            { services: ['battery_service'] },
            { namePrefix: 'Apple Watch' },
            { namePrefix: 'Galaxy Watch' },
            { namePrefix: 'Fitbit' }
          ]
        };

        // This would be called when user initiates pairing
        // const device = await this.bluetoothAdapter.requestDevice(options);
        // await this.connectWearableDevice(device);
      } catch (error) {
        console.warn('Wearable device detection failed:', error);
      }
    }
  }

  private async connectWearableDevice(device: any): Promise<void> {
    try {
      const connectedDevice: ConnectedDevice = {
        id: device.id,
        name: device.name || 'Wearable Device',
        type: 'smartwatch',
        capabilities: [
          { type: 'input', name: 'voice', description: 'Voice input', supported: true },
          { type: 'output', name: 'notifications', description: 'Notification display', supported: true },
          { type: 'sensor', name: 'activity', description: 'Activity tracking', supported: true }
        ],
        status: 'connected',
        lastSyncTime: new Date()
      };

      this.connectedDevices.set(device.id, connectedDevice);
      this.onDeviceConnectedCallback?.(connectedDevice);
    } catch (error) {
      console.error('Failed to connect wearable device:', error);
    }
  }

  // Mobile Companion App Integration
  private async detectMobileCompanionApps(): Promise<void> {
    // Check for QR code scanning capability
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector();
        // Set up QR code scanning for companion app pairing
      } catch (error) {
        console.warn('Barcode detection not available:', error);
      }
    }
  }

  // Device Management
  async requestDeviceConnection(type: 'bluetooth' | 'usb' | 'nfc'): Promise<ConnectedDevice | null> {
    try {
      switch (type) {
        case 'bluetooth':
          return await this.requestBluetoothDevice();
        case 'usb':
          return await this.requestUSBDevice();
        case 'nfc':
          return await this.requestNFCDevice();
        default:
          throw new Error('Unsupported device type');
      }
    } catch (error) {
      console.error('Device connection request failed:', error);
      return null;
    }
  }

  private async requestBluetoothDevice(): Promise<ConnectedDevice | null> {
    if (!this.bluetoothAdapter) return null;

    try {
      const device = await this.bluetoothAdapter.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      const gatt = await device.gatt.connect();
      
      const connectedDevice: ConnectedDevice = {
        id: device.id,
        name: device.name || 'Bluetooth Device',
        type: 'other',
        capabilities: [
          { type: 'input', name: 'data', description: 'Data input', supported: true }
        ],
        status: 'connected',
        lastSyncTime: new Date()
      };

      this.connectedDevices.set(device.id, connectedDevice);
      return connectedDevice;
    } catch (error) {
      console.error('Bluetooth device request failed:', error);
      return null;
    }
  }

  private async requestUSBDevice(): Promise<ConnectedDevice | null> {
    if (!('usb' in navigator)) return null;

    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      await device.open();

      const connectedDevice: ConnectedDevice = {
        id: device.serialNumber || 'usb-' + Date.now(),
        name: device.productName || 'USB Device',
        type: 'other',
        capabilities: [
          { type: 'input', name: 'data', description: 'USB data transfer', supported: true }
        ],
        status: 'connected',
        lastSyncTime: new Date()
      };

      this.connectedDevices.set(connectedDevice.id, connectedDevice);
      return connectedDevice;
    } catch (error) {
      console.error('USB device request failed:', error);
      return null;
    }
  }

  private async requestNFCDevice(): Promise<ConnectedDevice | null> {
    // NFC devices would be detected through scanning
    return null;
  }

  // Data Synchronization
  async syncDataToDevice(deviceId: string, data: SyncData): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return false;

    try {
      if (this.webSocketConnection && this.webSocketConnection.readyState === WebSocket.OPEN) {
        this.webSocketConnection.send(JSON.stringify({
          type: 'sync_to_device',
          deviceId,
          data
        }));
      }

      device.status = 'syncing';
      device.lastSyncTime = new Date();
      return true;
    } catch (error) {
      console.error('Data sync to device failed:', error);
      return false;
    }
  }

  async syncDataFromDevice(deviceId: string): Promise<SyncData | null> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return null;

    try {
      if (this.webSocketConnection && this.webSocketConnection.readyState === WebSocket.OPEN) {
        this.webSocketConnection.send(JSON.stringify({
          type: 'sync_from_device',
          deviceId
        }));
      }

      device.status = 'syncing';
      return null; // Data would come through WebSocket message
    } catch (error) {
      console.error('Data sync from device failed:', error);
      return null;
    }
  }

  // Event Handlers
  private handleUSBConnect(event: any): void {
    console.log('USB device connected:', event.device);
    // Auto-detect and connect if it's a known device type
  }

  private handleUSBDisconnect(event: any): void {
    console.log('USB device disconnected:', event.device);
    const deviceId = event.device.serialNumber || 'usb-unknown';
    this.connectedDevices.delete(deviceId);
    this.onDeviceDisconnectedCallback?.(deviceId);
  }

  private handleNFCReading(event: any): void {
    console.log('NFC reading:', event);
    const message = event.message;
    for (const record of message.records) {
      if (record.recordType === 'text') {
        const textDecoder = new TextDecoder(record.encoding);
        const data = textDecoder.decode(record.data);
        this.onDataReceivedCallback?.('nfc-device', { text: data });
      }
    }
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'device_connected':
        this.onDeviceConnectedCallback?.(data.device);
        break;
      case 'device_disconnected':
        this.connectedDevices.delete(data.deviceId);
        this.onDeviceDisconnectedCallback?.(data.deviceId);
        break;
      case 'sync_data':
        this.onDataReceivedCallback?.(data.deviceId, data.data);
        break;
    }
  }

  // Public API
  getConnectedDevices(): ConnectedDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  getDevice(deviceId: string): ConnectedDevice | null {
    return this.connectedDevices.get(deviceId) || null;
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return false;

    try {
      // Send disconnect command through WebSocket
      if (this.webSocketConnection && this.webSocketConnection.readyState === WebSocket.OPEN) {
        this.webSocketConnection.send(JSON.stringify({
          type: 'disconnect_device',
          deviceId
        }));
      }

      this.connectedDevices.delete(deviceId);
      this.onDeviceDisconnectedCallback?.(deviceId);
      return true;
    } catch (error) {
      console.error('Device disconnection failed:', error);
      return false;
    }
  }

  getDeviceCapabilities(): {
    bluetooth: boolean;
    usb: boolean;
    nfc: boolean;
    webSocket: boolean;
    pointerEvents: boolean;
  } {
    return {
      bluetooth: 'bluetooth' in navigator,
      usb: 'usb' in navigator,
      nfc: 'NDEFReader' in window,
      webSocket: 'WebSocket' in window,
      pointerEvents: 'PointerEvent' in window
    };
  }

  // Event Listeners
  onDeviceConnected(callback: (device: ConnectedDevice) => void): void {
    this.onDeviceConnectedCallback = callback;
  }

  onDeviceDisconnected(callback: (deviceId: string) => void): void {
    this.onDeviceDisconnectedCallback = callback;
  }

  onDataReceived(callback: (deviceId: string, data: any) => void): void {
    this.onDataReceivedCallback = callback;
  }

  destroy(): void {
    if (this.webSocketConnection) {
      this.webSocketConnection.close();
    }

    this.connectedDevices.clear();
    this.onDeviceConnectedCallback = undefined;
    this.onDeviceDisconnectedCallback = undefined;
    this.onDataReceivedCallback = undefined;
    this.isInitialized = false;
  }
}

export const smartDeviceConnectivityService = new SmartDeviceConnectivityService();