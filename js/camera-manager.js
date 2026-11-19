// WorkSense AI - Multi-Camera Management & Stream Orchestrator

class CameraManager {
  constructor() {
    this.devices = [];
    this.activeDeviceId = null;
    this.onDevicesChanged = null;
    this.onCameraDisconnected = null;
    
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', () => this.refreshDevices());
    }
  }

  async getAvailableDevices() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      this.devices = allDevices.filter(d => d.kind === 'videoinput');
      return this.devices;
    } catch (err) {
      console.warn("Could not enumerate camera devices:", err);
      return [];
    }
  }

  async refreshDevices() {
    const oldDevices = [...this.devices];
    const newDevices = await this.getAvailableDevices();
    
    // Check if previously active camera was unplugged
    if (this.activeDeviceId && !newDevices.some(d => d.deviceId === this.activeDeviceId)) {
      if (this.onCameraDisconnected) {
        this.onCameraDisconnected(this.activeDeviceId);
      }
    }
    
    if (this.onDevicesChanged) {
      this.onDevicesChanged(newDevices);
    }
  }

  setActiveDevice(deviceId) {
    this.activeDeviceId = deviceId;
  }

  getAllCameras() {
    return window.appState ? window.appState.cameras : [];
  }

  assignEmployeeToCamera(cameraId, employeeId) {
    if (!window.appState) return;
    const cam = window.appState.updateCamera(cameraId, { assignedEmployeeId: employeeId });
    const emp = window.appState.updateEmployee(employeeId, { cameraAssigned: cameraId });
    window.appState.addAuditLog('CAMERA_ASSIGNMENT', `Assigned camera ${cameraId} to employee ${employeeId}`);
    return { cam, emp };
  }
}

window.cameraManager = new CameraManager();

