// WorkSense AI - Central State Management & Persistence Store

const STORAGE_KEYS = {
  EMPLOYEES: 'worksense_employees',
  CAMERAS: 'worksense_cameras',
  ATTENDANCE: 'worksense_attendance',
  ALERTS: 'worksense_alerts',
  AUDIT_LOGS: 'worksense_audit_logs',
  SETTINGS: 'worksense_settings',
  AUTH: 'worksense_auth',
  USE_DEMO_DATA: 'worksense_use_demo_data'
};

const DEFAULT_EMPLOYEES = [
  {
    id: 'EMP-1001',
    name: 'Ashwin S',
    email: 'ashwin@worksense.ai',
    department: 'Engineering',
    designation: 'Lead AI Engineer',
    workstation: 'WS-01',
    cameraAssigned: 'CAM-01',
    status: 'Active',
    avatar: 'AS',
    joinedDate: '2024-01-15',
    consentSigned: true,
    phone: '+91 98765 43210'
  },
  {
    id: 'EMP-1002',
    name: 'Priya Sharma',
    email: 'priya.s@worksense.ai',
    department: 'Engineering',
    designation: 'Senior Frontend Engineer',
    workstation: 'WS-02',
    cameraAssigned: 'CAM-02',
    status: 'Active',
    avatar: 'PS',
    joinedDate: '2024-03-01',
    consentSigned: true,
    phone: '+91 98765 43211'
  },
  {
    id: 'EMP-1003',
    name: 'David Miller',
    email: 'david.m@worksense.ai',
    department: 'Product Design',
    designation: 'UI/UX Lead',
    workstation: 'WS-03',
    cameraAssigned: 'CAM-04',
    status: 'On Break',
    avatar: 'DM',
    joinedDate: '2023-11-10',
    consentSigned: true,
    phone: '+1 555-0192'
  },
  {
    id: 'EMP-1004',
    name: 'Ananya Roy',
    email: 'ananya.r@worksense.ai',
    department: 'Customer Support',
    designation: 'Support Operations Specialist',
    workstation: 'WS-04',
    cameraAssigned: 'CAM-03',
    status: 'Active',
    avatar: 'AR',
    joinedDate: '2024-05-20',
    consentSigned: true,
    phone: '+91 98765 43214'
  },
  {
    id: 'EMP-1005',
    name: 'Marcus Chen',
    email: 'marcus.c@worksense.ai',
    department: 'Operations',
    designation: 'DevOps & Infrastructure Lead',
    workstation: 'WS-05',
    cameraAssigned: 'None',
    status: 'Away',
    avatar: 'MC',
    joinedDate: '2023-08-14',
    consentSigned: true,
    phone: '+1 555-0188'
  },
  {
    id: 'EMP-1006',
    name: 'Sara Khan',
    email: 'sara.k@worksense.ai',
    department: 'Human Resources',
    designation: 'People & Culture Manager',
    workstation: 'WS-06',
    cameraAssigned: 'None',
    status: 'Active',
    avatar: 'SK',
    joinedDate: '2023-04-10',
    consentSigned: true,
    phone: '+91 98765 43218'
  }
];

const DEFAULT_CAMERAS = [
  {
    id: 'CAM-01',
    name: 'Primary Webcam (WS-01)',
    type: 'Local Webcam',
    location: 'Engineering Pod A',
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
    location: 'Engineering Pod B',
    assignedEmployeeId: 'EMP-1002',
    status: 'Online',
    resolution: '1920x1080',
    fps: 25,
    isHardware: false
  },
  {
    id: 'CAM-03',
    name: 'Support Station Cam',
    type: 'IP Camera / RTSP',
    location: 'Support Floor 2',
    assignedEmployeeId: 'EMP-1004',
    status: 'Online',
    resolution: '1280x720',
    fps: 25,
    isHardware: false
  },
  {
    id: 'CAM-04',
    name: 'Design Studio Cam',
    type: 'IP Camera / RTSP',
    location: 'Creative Lab 1',
    assignedEmployeeId: 'EMP-1003',
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
  notificationEmail: 'alerts@worksense.ai',
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
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    employeeId: 'EMP-1001',
    employeeName: 'Ashwin S',
    camera: 'CAM-01',
    description: 'Prolonged eye closure and yawning detected during shift.',
    xaiSummary: 'Eye Aspect Ratio (EAR) dropped below 0.25 threshold with 2 yawn events detected within 3 minutes.',
    status: 'Acknowledged',
    acknowledgedBy: 'Sara Khan (HR)',
    acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'ALT-9002',
    type: 'ABSENCE',
    severity: 'Info',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    employeeId: 'EMP-1003',
    employeeName: 'David Miller',
    camera: 'CAM-04',
    description: 'Workstation absence exceeded scheduled break window.',
    xaiSummary: 'Face presence not detected on camera CAM-04 for 18 minutes (scheduled lunch break exceeded).',
    status: 'Unacknowledged',
    acknowledgedBy: null,
    acknowledgedAt: null
  },
  {
    id: 'ALT-9003',
    type: 'POSTURE',
    severity: 'Warning',
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    employeeId: 'EMP-1002',
    employeeName: 'Priya Sharma',
    camera: 'CAM-02',
    description: 'Persistent slouching / downward head pitch detected.',
    xaiSummary: 'Head pitch exceeded -24° for over 15 minutes, indicating potential ergonomic strain or mobile phone distraction.',
    status: 'Unacknowledged',
    acknowledgedBy: null,
    acknowledgedAt: null
  }
];

class StateManager {
  constructor() {
    this.employees = this._load(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    this.cameras = this._load(STORAGE_KEYS.CAMERAS, DEFAULT_CAMERAS);
    this.settings = this._load(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    this.alerts = this._load(STORAGE_KEYS.ALERTS, DEFAULT_ALERTS);
    this.auditLogs = this._load(STORAGE_KEYS.AUDIT_LOGS, this._getDefaultAuditLogs());
    this.useDemoData = this._load(STORAGE_KEYS.USE_DEMO_DATA, true);
    this.attendance = this._load(STORAGE_KEYS.ATTENDANCE, this._getDefaultAttendance());
    
    // Auth state
    this.currentRole = 'ADMIN'; // ADMIN, MANAGER, HR, EMPLOYEE
    this.currentUser = {
      id: 'EMP-1001',
      name: 'Ashwin S (Admin)',
      role: 'ADMIN',
      email: 'admin@worksense.ai'
    };
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
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        user: 'admin@worksense.ai',
        role: 'ADMIN',
        action: 'SYSTEM_BOOT',
        details: 'WorkSense AI Employee Monitoring Platform initialized with MediaPipe Tasks engine.'
      },
      {
        id: 'AUD-002',
        timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
        user: 'admin@worksense.ai',
        role: 'ADMIN',
        action: 'CAMERA_CONFIG',
        details: 'Assigned CAM-01 (Primary Webcam) to Ashwin S (EMP-1001).'
      },
      {
        id: 'AUD-003',
        timestamp: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
        user: 'sara.k@worksense.ai',
        role: 'HR',
        action: 'ALERT_ACKNOWLEDGE',
        details: 'Acknowledged drowsiness alert ALT-9001 for EMP-1001.'
      }
    ];
  }

  _getDefaultAttendance() {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'ATT-1001',
        employeeId: 'EMP-1001',
        name: 'Ashwin S',
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
        id: 'ATT-1002',
        employeeId: 'EMP-1002',
        name: 'Priya Sharma',
        department: 'Engineering',
        date: today,
        checkIn: '08:55:00',
        checkOut: null,
        durationSeconds: 14800,
        breakSeconds: 1200,
        status: 'Present',
        isLate: false
      },
      {
        id: 'ATT-1003',
        employeeId: 'EMP-1003',
        name: 'David Miller',
        department: 'Product Design',
        date: today,
        checkIn: '09:42:10',
        checkOut: null,
        durationSeconds: 11800,
        breakSeconds: 2400,
        status: 'Present',
        isLate: true // Arrived after 09:15 grace
      },
      {
        id: 'ATT-1004',
        employeeId: 'EMP-1004',
        name: 'Ananya Roy',
        department: 'Customer Support',
        date: today,
        checkIn: '09:00:10',
        checkOut: null,
        durationSeconds: 14400,
        breakSeconds: 1500,
        status: 'Present',
        isLate: false
      },
      {
        id: 'ATT-1005',
        employeeId: 'EMP-1005',
        name: 'Marcus Chen',
        department: 'Operations',
        date: today,
        checkIn: null,
        checkOut: null,
        durationSeconds: 0,
        breakSeconds: 0,
        status: 'Absent',
        isLate: false
      },
      {
        id: 'ATT-1006',
        employeeId: 'EMP-1006',
        name: 'Sara Khan',
        department: 'Human Resources',
        date: today,
        checkIn: '08:48:30',
        checkOut: null,
        durationSeconds: 15200,
        breakSeconds: 900,
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
      joinedDate: new Date().toISOString().split('T')[0],
      consentSigned: true,
      ...emp
    };
    this.employees.push(newEmp);
    this._save(STORAGE_KEYS.EMPLOYEES, this.employees);
    this.addAuditLog('EMPLOYEE_CREATE', `Added employee ${newEmp.name} (${newEmp.id}) to ${newEmp.department}`);
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
    const emp = this.employees.find(e => e.id === id);
    this.employees = this.employees.filter(e => e.id !== id);
    this._save(STORAGE_KEYS.EMPLOYEES, this.employees);
    if (emp) {
      this.addAuditLog('EMPLOYEE_DELETE', `Deleted employee record for ${emp.name} (${id})`);
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
      alert.acknowledgedBy = `${this.currentUser.name} (${this.currentRole})`;
      alert.acknowledgedAt = new Date().toISOString();
      this._save(STORAGE_KEYS.ALERTS, this.alerts);
      this.addAuditLog('ALERT_ACKNOWLEDGE', `Acknowledged alert ${id} by ${this.currentUser.name}`);
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
    // Keep max 200 logs
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    this._save(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    return log;
  }

  // Settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this._save(STORAGE_KEYS.SETTINGS, this.settings);
    this.addAuditLog('SETTINGS_UPDATE', 'Updated system monitoring thresholds and policies');
    return this.settings;
  }

  // Role Switching
  setRole(role) {
    this.currentRole = role;
    const names = {
      ADMIN: 'Ashwin S (Admin)',
      MANAGER: 'David Miller (Manager)',
      HR: 'Sara Khan (HR Director)',
      EMPLOYEE: 'Ashwin S (Employee View)'
    };
    this.currentUser.role = role;
    this.currentUser.name = names[role] || role;
    this.currentUser.email = `${role.toLowerCase()}@worksense.ai`;
    this.addAuditLog('ROLE_SWITCH', `Switched active dashboard session to role: ${role}`);
  }
}

window.appState = new StateManager();

