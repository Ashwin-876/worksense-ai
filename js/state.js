// WorkSense AI - Central State Management & Persistence Store
// Updated: Staff and Administrator Registry

const STORAGE_KEYS = {
  EMPLOYEES: 'worksense_employees',
  CAMERAS: 'worksense_cameras',
  ATTENDANCE: 'worksense_attendance',
  ALERTS: 'worksense_alerts',
  AUDIT_LOGS: 'worksense_audit_logs',
  SETTINGS: 'worksense_settings',
  AUTH: 'worksense_auth',
  USE_DEMO_DATA: 'worksense_use_demo_data',
  DB_VERSION: 'worksense_db_version'
};

const CURRENT_DB_VERSION = 'v2_anandhi_super_admin';

// Purge any stale session or legacy records from previous sessions
try {
  if (localStorage.getItem(STORAGE_KEYS.DB_VERSION) !== CURRENT_DB_VERSION) {
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.CAMERAS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.setItem(STORAGE_KEYS.DB_VERSION, CURRENT_DB_VERSION);
  }
} catch (e) {
  console.warn("Storage migration check error:", e);
}

// 4 Verified Staff Records: Anandhi C (Super Admin) + 3 Employees
const DEFAULT_EMPLOYEES = [
  {
    id: 'EMP-1001',
    name: 'Anandhi C',
    email: 'anandhi@worksense.ai',
    department: 'Administration',
    designation: 'Super Administrator',
    role: 'SUPER_ADMIN',
    workstation: 'WS-01',
    cameraAssigned: 'CAM-01',
    status: 'Active',
    avatar: 'AC',
    joinedDate: '2023-01-15',
    consentSigned: true,
    phone: '+91 98765 00001'
  },
  {
    id: 'EMP-1002',
    name: 'Akash A',
    email: 'akash.a@worksense.ai',
    department: 'Engineering',
    designation: 'Software Engineer',
    role: 'EMPLOYEE',
    workstation: 'WS-02',
    cameraAssigned: 'CAM-02',
    status: 'Active',
    avatar: 'AA',
    joinedDate: '2024-02-10',
    consentSigned: true,
    phone: '+91 98765 00002'
  },
  {
    id: 'EMP-1003',
    name: 'Kanishka Sri S',
    email: 'kanishka.s@worksense.ai',
    department: 'Quality & Testing',
    designation: 'QA Specialist',
    role: 'EMPLOYEE',
    workstation: 'WS-03',
    cameraAssigned: 'CAM-03',
    status: 'Active',
    avatar: 'KS',
    joinedDate: '2024-03-15',
    consentSigned: true,
    phone: '+91 98765 00003'
  },
  {
    id: 'EMP-1004',
    name: 'Kartik Raja N',
    email: 'kartik.r@worksense.ai',
    department: 'Operations',
    designation: 'Operations Associate',
    role: 'EMPLOYEE',
    workstation: 'WS-04',
    cameraAssigned: 'CAM-04',
    status: 'Active',
    avatar: 'KR',
    joinedDate: '2024-05-01',
    consentSigned: true,
    phone: '+91 98765 00004'
  }
];

const DEFAULT_CAMERAS = [
  {
    id: 'CAM-01',
    name: 'Primary Webcam (WS-01)',
    type: 'Local Webcam',
    location: 'Executive Desk 1',
    assignedEmployeeId: 'EMP-1001',
    status: 'Online',
    resolution: '1280x720',
    fps: 30,
    isHardware: true
  },
  {
    id: 'CAM-02',
    name: 'Workstation 2 Camera',
    type: 'IP Camera / RTSP',
    location: 'Engineering Pod A',
    assignedEmployeeId: 'EMP-1002',
    status: 'Online',
    resolution: '1920x1080',
    fps: 25,
    isHardware: false
  },
  {
    id: 'CAM-03',
    name: 'QA Station Camera',
    type: 'IP Camera / RTSP',
    location: 'Quality Lab 1',
    assignedEmployeeId: 'EMP-1003',
    status: 'Online',
    resolution: '1280x720',
    fps: 25,
    isHardware: false
  },
  {
    id: 'CAM-04',
    name: 'Operations Pod Camera',
    type: 'IP Camera / RTSP',
    location: 'Operations Floor',
    assignedEmployeeId: 'EMP-1004',
    status: 'Standby',
    resolution: '1280x720',
    fps: 20,
    isHardware: false
  }
];

const DEFAULT_SETTINGS = {
  eyeClosureThreshold: 300, // seconds
  absenceThreshold: 120, // seconds
  talkFrequencyThreshold: 4, // events/minute
  yawnThreshold: 0.08, // MAR
  yawnMinDuration: 1.8, // seconds
  soundAlerts: true,
  emailNotifications: true,
  notificationEmail: 'anandhi@worksense.ai',
  privacyBlurMode: false,
  metadataOnlyRetention: true,
  dataRetentionDays: 30,
  drawFaceMesh: true,
  shiftStartTime: '09:00',
  shiftDurationHours: 8
};

const DEFAULT_ALERTS = [
  {
    id: 'ALT-9001',
    type: 'DROWSINESS',
    severity: 'Warning',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    employeeId: 'EMP-1002',
    employeeName: 'Akash A',
    camera: 'CAM-02',
    description: 'Prolonged eye closure and yawning detected during shift.',
    xaiSummary: 'Eye Aspect Ratio (EAR) dropped below 0.25 threshold with 2 yawn events detected within 3 minutes.',
    status: 'Acknowledged',
    acknowledgedBy: 'Anandhi C (Super Admin)',
    acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'ALT-9002',
    type: 'POSTURE',
    severity: 'Warning',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    employeeId: 'EMP-1003',
    employeeName: 'Kanishka Sri S',
    camera: 'CAM-03',
    description: 'Persistent downward pitch / ergonomic strain detected.',
    xaiSummary: 'Head pitch exceeded -22° for over 12 minutes, indicating potential ergonomic strain or mobile usage.',
    status: 'Unacknowledged',
    acknowledgedBy: null,
    acknowledgedAt: null
  },
  {
    id: 'ALT-9003',
    type: 'ABSENCE',
    severity: 'Info',
    timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    employeeId: 'EMP-1004',
    employeeName: 'Kartik Raja N',
    camera: 'CAM-04',
    description: 'Workstation absence detected during active shift window.',
    xaiSummary: 'Face presence not detected on camera CAM-04 for 14 minutes.',
    status: 'Unacknowledged',
    acknowledgedBy: null,
    acknowledgedAt: null
  }
];

class StateManager {
  constructor() {
    this.employees = this._cleanseLegacy(this._load(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES));
    this.cameras = this._load(STORAGE_KEYS.CAMERAS, DEFAULT_CAMERAS);
    this.settings = this._load(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    this.alerts = this._load(STORAGE_KEYS.ALERTS, DEFAULT_ALERTS);
    this.auditLogs = this._load(STORAGE_KEYS.AUDIT_LOGS, this._getDefaultAuditLogs());
    this.useDemoData = this._load(STORAGE_KEYS.USE_DEMO_DATA, true);
    this.attendance = this._load(STORAGE_KEYS.ATTENDANCE, this._getDefaultAttendance());
    
    // Check if an existing session is saved
    let saved = null;
    try {
      const savedRaw = localStorage.getItem('worksense_active_session');
      saved = savedRaw ? JSON.parse(savedRaw) : null;
    } catch(e) {}

    if (saved && saved.roleKey) {
      this.currentRoleKey = saved.roleKey;
      this.currentRole = saved.role || (saved.roleKey === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EMPLOYEE');
      this.currentUser = {
        id: saved.userId || 'EMP-1001',
        name: saved.name || 'Anandhi C (Super Admin)',
        role: this.currentRole,
        email: saved.email || 'anandhi@worksense.ai'
      };
    } else {
      // Primary Administrator: Anandhi C (Super Admin)
      this.currentRole = 'SUPER_ADMIN';
      this.currentRoleKey = 'SUPER_ADMIN';
      this.currentUser = {
        id: 'EMP-1001',
        name: 'Anandhi C (Super Admin)',
        role: 'SUPER_ADMIN',
        email: 'anandhi@worksense.ai'
      };
    }
  }

  _cleanseLegacy(employeesList) {
    // Completely remove any legacy or Ashwin references from the employee registry
    const cleansed = employeesList.filter(e => !e.name.toLowerCase().includes('ashwin'));
    if (cleansed.length === 0 || !cleansed.some(e => e.id === 'EMP-1001')) {
      return [...DEFAULT_EMPLOYEES];
    }
    return cleansed;
  }

  _load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  _save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn("Storage quota exceeded or unavailable:", e);
    }
  }

  _getDefaultAuditLogs() {
    const now = new Date();
    return [
      {
        id: 'AUD-001',
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        user: 'system@worksense.ai',
        role: 'SYSTEM',
        action: 'SYSTEM_BOOT',
        details: 'WorkSense AI Employee Monitoring Platform initialized with Anandhi C as Super Admin.'
      },
      {
        id: 'AUD-002',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        user: 'anandhi@worksense.ai',
        role: 'SUPER_ADMIN',
        action: 'CAMERA_CONFIG',
        details: 'Assigned CAM-01 (Primary Webcam) to Anandhi C (EMP-1001).'
      },
      {
        id: 'AUD-003',
        timestamp: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
        user: 'anandhi@worksense.ai',
        role: 'SUPER_ADMIN',
        action: 'ALERT_ACKNOWLEDGE',
        details: 'Acknowledged drowsiness alert ALT-9001 for Akash A (EMP-1002).'
      },
      {
        id: 'AUD-004',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        user: 'anandhi@worksense.ai',
        role: 'SUPER_ADMIN',
        action: 'SECURITY_AUDIT',
        details: 'Verified administrator access control: Anandhi C designated as Super Admin. Legacy credentials revoked.'
      }
    ];
  }

  _getDefaultAttendance() {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'ATT-1001',
        employeeId: 'EMP-1001',
        name: 'Anandhi C',
        department: 'Administration',
        date: today,
        checkIn: '08:50:00',
        checkOut: null,
        durationSeconds: 15400,
        breakSeconds: 1200,
        status: 'Present',
        isLate: false
      },
      {
        id: 'ATT-1002',
        employeeId: 'EMP-1002',
        name: 'Akash A',
        department: 'Engineering',
        date: today,
        checkIn: '09:02:15',
        checkOut: null,
        durationSeconds: 14200,
        breakSeconds: 1800,
        status: 'Present',
        isLate: false
      },
      {
        id: 'ATT-1003',
        employeeId: 'EMP-1003',
        name: 'Kanishka Sri S',
        department: 'Quality & Testing',
        date: today,
        checkIn: '08:58:30',
        checkOut: null,
        durationSeconds: 14800,
        breakSeconds: 1400,
        status: 'Present',
        isLate: false
      },
      {
        id: 'ATT-1004',
        employeeId: 'EMP-1004',
        name: 'Kartik Raja N',
        department: 'Operations',
        date: today,
        checkIn: '09:05:10',
        checkOut: null,
        durationSeconds: 13900,
        breakSeconds: 1600,
        status: 'Present',
        isLate: false
      }
    ];
  }

  // Employee CRUD
  addEmployee(emp) {
    const id = `EMP-${1000 + this.employees.length + 1}`;
    const initials = emp.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const newEmp = {
      id,
      avatar: initials || 'EM',
      role: 'EMPLOYEE',
      joinedDate: new Date().toISOString().split('T')[0],
      consentSigned: true,
      ...emp
    };
    this.employees.push(newEmp);
    this._save(STORAGE_KEYS.EMPLOYEES, this.employees);
    this.addAuditLog('EMPLOYEE_CREATE', `Super Admin Anandhi C added employee ${newEmp.name} (${newEmp.id}) to ${newEmp.department}`);
    return newEmp;
  }

  updateEmployee(id, updates) {
    const idx = this.employees.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.employees[idx] = { ...this.employees[idx], ...updates };
      this._save(STORAGE_KEYS.EMPLOYEES, this.employees);
      this.addAuditLog('EMPLOYEE_UPDATE', `Updated profile for employee ${id}`);
      return this.employees[idx];
    }
    return null;
  }

  deleteEmployee(id) {
    if (id === 'EMP-1001') {
      alert("Error: Primary Super Admin account (Anandhi C) cannot be removed.");
      return;
    }
    const emp = this.employees.find(e => e.id === id);
    this.employees = this.employees.filter(e => e.id !== id);
    this._save(STORAGE_KEYS.EMPLOYEES, this.employees);
    if (emp) {
      this.addAuditLog('EMPLOYEE_DELETE', `Super Admin Anandhi C removed employee record for ${emp.name} (${id})`);
    }
  }

  // Camera Management
  addCamera(cam) {
    const id = `CAM-0${this.cameras.length + 1}`;
    const newCam = {
      id,
      status: 'Online',
      fps: 30,
      resolution: '1280x720',
      isHardware: false,
      ...cam
    };
    this.cameras.push(newCam);
    this._save(STORAGE_KEYS.CAMERAS, this.cameras);
    this.addAuditLog('CAMERA_ADD', `Added camera ${newCam.name} (${id})`);
    return newCam;
  }

  updateCamera(id, updates) {
    const idx = this.cameras.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.cameras[idx] = { ...this.cameras[idx], ...updates };
      this._save(STORAGE_KEYS.CAMERAS, this.cameras);
      return this.cameras[idx];
    }
    return null;
  }

  // Alerts Management
  addAlert(alertData) {
    const id = `ALT-${9000 + this.alerts.length + 1}`;
    const newAlert = {
      id,
      timestamp: new Date().toISOString(),
      status: 'Unacknowledged',
      acknowledgedBy: null,
      acknowledgedAt: null,
      ...alertData
    };
    this.alerts.unshift(newAlert);
    this._save(STORAGE_KEYS.ALERTS, this.alerts);
    this.addAuditLog('ALERT_TRIGGERED', `Triggered ${newAlert.severity} ${newAlert.type} alert for ${newAlert.employeeName}`);
    return newAlert;
  }

  acknowledgeAlert(id) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'Acknowledged';
      alert.acknowledgedBy = `${this.currentUser.name}`;
      alert.acknowledgedAt = new Date().toISOString();
      this._save(STORAGE_KEYS.ALERTS, this.alerts);
      this.addAuditLog('ALERT_ACKNOWLEDGE', `Acknowledged alert ${id} by Super Admin Anandhi C`);
      return alert;
    }
    return null;
  }

  dismissAlert(id) {
    this.alerts = this.alerts.filter(a => a.id !== id);
    this._save(STORAGE_KEYS.ALERTS, this.alerts);
  }

  // Attendance Management
  recordCheckIn(employeeId) {
    const emp = this.employees.find(e => e.id === employeeId);
    if (!emp) return null;

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];
    let att = this.attendance.find(a => a.employeeId === employeeId && a.date === today);

    if (!att) {
      const isLate = parseInt(nowTime.slice(0, 2)) >= 9 && parseInt(nowTime.slice(3, 5)) > 15;
      att = {
        id: `ATT-${1000 + this.attendance.length + 1}`,
        employeeId,
        name: emp.name,
        department: emp.department,
        date: today,
        checkIn: nowTime,
        checkOut: null,
        durationSeconds: 0,
        breakSeconds: 0,
        status: 'Present',
        isLate
      };
      this.attendance.unshift(att);
    } else if (!att.checkIn) {
      att.checkIn = nowTime;
      att.status = 'Present';
    }
    this._save(STORAGE_KEYS.ATTENDANCE, this.attendance);
    this.addAuditLog('CHECK_IN', `${emp.name} checked in at ${nowTime}`);
    return att;
  }

  recordCheckOut(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];
    const att = this.attendance.find(a => a.employeeId === employeeId && a.date === today);

    if (att) {
      att.checkOut = nowTime;
      this._save(STORAGE_KEYS.ATTENDANCE, this.attendance);
      this.addAuditLog('CHECK_OUT', `${att.name} checked out at ${nowTime}`);
      return att;
    }
    return null;
  }

  // Audit Logs
  addAuditLog(action, details) {
    const log = {
      id: `AUD-${String(this.auditLogs.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      user: this.currentUser.email,
      role: this.currentRole,
      action,
      details
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    this._save(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    return log;
  }

  // Settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this._save(STORAGE_KEYS.SETTINGS, this.settings);
    this.addAuditLog('SETTINGS_UPDATE', 'Super Admin Anandhi C updated system monitoring thresholds');
    return this.settings;
  }

  // Role Switching between Super Admin and Employees
  setRole(roleKey) {
    this.currentRoleKey = roleKey;
    if (roleKey === 'SUPER_ADMIN' || roleKey === 'ADMIN') {
      this.currentRole = 'SUPER_ADMIN';
      this.currentUser = {
        id: 'EMP-1001',
        name: 'Anandhi C (Super Admin)',
        role: 'SUPER_ADMIN',
        email: 'anandhi@worksense.ai'
      };
    } else if (roleKey === 'EMPLOYEE_AKASH') {
      this.currentRole = 'EMPLOYEE';
      this.currentUser = {
        id: 'EMP-1002',
        name: 'Akash A (Employee)',
        role: 'EMPLOYEE',
        email: 'akash.a@worksense.ai'
      };
    } else if (roleKey === 'EMPLOYEE_KANISHKA') {
      this.currentRole = 'EMPLOYEE';
      this.currentUser = {
        id: 'EMP-1003',
        name: 'Kanishka Sri S (Employee)',
        role: 'EMPLOYEE',
        email: 'kanishka.s@worksense.ai'
      };
    } else if (roleKey === 'EMPLOYEE_KARTIK') {
      this.currentRole = 'EMPLOYEE';
      this.currentUser = {
        id: 'EMP-1004',
        name: 'Kartik Raja N (Employee)',
        role: 'EMPLOYEE',
        email: 'kartik.r@worksense.ai'
      };
    } else {
      this.currentRole = 'EMPLOYEE';
      this.currentUser = {
        id: 'EMP-1002',
        name: 'Employee View',
        role: 'EMPLOYEE',
        email: 'employee@worksense.ai'
      };
    }
    this.addAuditLog('ROLE_SWITCH', `Switched active dashboard session to: ${this.currentUser.name}`);
  }
}

window.appState = new StateManager();
