// WorkSense AI - Role-Based Access Control (RBAC) & Authentication Module
// Primary Super Administrator: Anandhi C

const PERMISSIONS = {
  SUPER_ADMIN: [
    'view_overview', 'view_monitoring', 'view_cameras', 'manage_cameras',
    'view_employees', 'manage_employees', 'view_attendance', 'manage_attendance',
    'view_alerts', 'manage_alerts', 'view_analytics', 'export_reports',
    'view_audit_logs', 'manage_settings', 'view_privacy'
  ],
  ADMIN: [
    'view_overview', 'view_monitoring', 'view_cameras', 'manage_cameras',
    'view_employees', 'manage_employees', 'view_attendance', 'manage_attendance',
    'view_alerts', 'manage_alerts', 'view_analytics', 'export_reports',
    'view_audit_logs', 'manage_settings', 'view_privacy'
  ],
  EMPLOYEE: [
    'view_overview', 'view_monitoring', 'view_attendance', 'view_privacy'
  ]
};

const STAFF_CREDENTIALS = [
  {
    id: 'EMP-1001',
    name: 'Anandhi C',
    displayName: 'Anandhi C (Super Admin)',
    email: 'anandhi@worksense.ai',
    password: 'admin123',
    role: 'SUPER_ADMIN',
    roleKey: 'SUPER_ADMIN',
    roleBadge: 'SUPER ADMIN',
    department: 'Administration',
    designation: 'Super Administrator',
    avatar: 'AC',
    workstation: 'WS-01',
    camera: 'CAM-01',
    themeColor: '#e11d48',
    description: 'Full administrative control over all 10 modules: cameras, staff management, live monitoring, alerts, attendance, and enterprise settings.'
  },
  {
    id: 'EMP-1002',
    name: 'Akash A',
    displayName: 'Akash A (Employee)',
    email: 'akash.a@worksense.ai',
    password: 'akash123',
    role: 'EMPLOYEE',
    roleKey: 'EMPLOYEE_AKASH',
    roleBadge: 'EMPLOYEE',
    department: 'Engineering',
    designation: 'Software Engineer',
    avatar: 'AA',
    workstation: 'WS-02',
    camera: 'CAM-02',
    themeColor: '#3fb950',
    description: 'Employee access: personal workstation camera telemetry (CAM-02), presence tracking, focus scores, and attendance record.'
  },
  {
    id: 'EMP-1003',
    name: 'Kanishka Sri S',
    displayName: 'Kanishka Sri S (Employee)',
    email: 'kanishka.s@worksense.ai',
    password: 'kanishka123',
    role: 'EMPLOYEE',
    roleKey: 'EMPLOYEE_KANISHKA',
    roleBadge: 'EMPLOYEE',
    department: 'Quality & Testing',
    designation: 'QA Specialist',
    avatar: 'KS',
    workstation: 'WS-03',
    camera: 'CAM-03',
    themeColor: '#3fb950',
    description: 'Employee access: QA lab workstation telemetry (CAM-03), posture & drowsiness detection, and activity history.'
  },
  {
    id: 'EMP-1004',
    name: 'Kartik Raja N',
    displayName: 'Kartik Raja N (Employee)',
    email: 'kartik.r@worksense.ai',
    password: 'kartik123',
    role: 'EMPLOYEE',
    roleKey: 'EMPLOYEE_KARTIK',
    roleBadge: 'EMPLOYEE',
    department: 'Operations',
    designation: 'Operations Associate',
    avatar: 'KR',
    workstation: 'WS-04',
    camera: 'CAM-04',
    themeColor: '#3fb950',
    description: 'Employee access: operations station feed (CAM-04), break duration logs, and personal compliance analytics.'
  }
];

class AuthManager {
  constructor() {
    this.roles = ['SUPER_ADMIN', 'EMPLOYEE_AKASH', 'EMPLOYEE_KANISHKA', 'EMPLOYEE_KARTIK'];
    this.sessionKey = 'worksense_active_session';
  }

  getStaffCredentials() {
    return STAFF_CREDENTIALS;
  }

  getCurrentRole() {
    return window.appState ? window.appState.currentRole : 'SUPER_ADMIN';
  }

  getCurrentRoleKey() {
    return window.appState ? (window.appState.currentRoleKey || 'SUPER_ADMIN') : 'SUPER_ADMIN';
  }

  getCurrentUser() {
    return window.appState ? window.appState.currentUser : { 
      name: 'Anandhi C (Super Admin)', 
      role: 'SUPER_ADMIN',
      id: 'EMP-1001',
      email: 'anandhi@worksense.ai'
    };
  }

  isSuperAdmin() {
    return this.getCurrentRole() === 'SUPER_ADMIN' || this.getCurrentRole() === 'ADMIN';
  }

  hasPermission(permission) {
    const role = this.getCurrentRole();
    const allowed = PERMISSIONS[role] || PERMISSIONS['EMPLOYEE'];
    return allowed.includes(permission);
  }

  isAuthenticated() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      return !!session;
    } catch (e) {
      return false;
    }
  }

  initSession() {
    try {
      const raw = localStorage.getItem(this.sessionKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && data.roleKey && window.appState) {
        window.appState.setRole(data.roleKey);
        return window.appState.currentUser;
      }
    } catch (e) {
      console.warn("Session restore error:", e);
    }
    return null;
  }

  login(identifier, password) {
    if (!identifier || !password) {
      return { success: false, error: 'Please enter your email or employee ID and password.' };
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPw = password.trim();

    // Find by email, employee ID, or partial name
    const user = STAFF_CREDENTIALS.find(u => 
      u.email.toLowerCase() === cleanId ||
      u.id.toLowerCase() === cleanId ||
      u.name.toLowerCase() === cleanId
    );

    if (!user) {
      return { 
        success: false, 
        error: 'Account not found. Please check your email or employee ID, or select an account below.' 
      };
    }

    // Check password (matches specific password OR universal fallback 'password123' / 'admin123')
    const isValidPassword = 
      cleanPw === user.password ||
      cleanPw === 'password123' ||
      cleanPw === 'worksense123' ||
      cleanPw === 'admin123';

    if (!isValidPassword) {
      return { 
        success: false, 
        error: `Incorrect password for ${user.name}. Hint: Use password "${user.password}" or "password123".` 
      };
    }

    // Set role and save session
    return this._completeLogin(user);
  }

  quickLogin(roleKey) {
    const user = STAFF_CREDENTIALS.find(u => u.roleKey === roleKey || u.id === roleKey);
    if (!user) {
      return { success: false, error: 'Target role not found' };
    }
    return this._completeLogin(user);
  }

  _completeLogin(user) {
    if (window.appState) {
      window.appState.setRole(user.roleKey);
      window.appState.addAuditLog('USER_LOGIN', `User ${user.name} (${user.roleBadge}) logged in to the portal.`);
    }

    const sessionPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleKey: user.roleKey,
      roleBadge: user.roleBadge,
      workstation: user.workstation,
      loggedInAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionPayload));
    } catch (e) {
      console.warn("Storage error saving session:", e);
    }

    return { success: true, user };
  }

  logout() {
    try {
      localStorage.removeItem(this.sessionKey);
      if (window.appState) {
        window.appState.addAuditLog('USER_LOGOUT', `Active user signed out of the WorkSense portal.`);
      }
    } catch (e) {
      console.warn("Storage error on logout:", e);
    }
    return true;
  }

  switchRole(roleKey) {
    const user = STAFF_CREDENTIALS.find(u => u.roleKey === roleKey);
    if (user) {
      return this._completeLogin(user);
    } else if (window.appState) {
      window.appState.setRole(roleKey);
    }
  }
}

window.authManager = new AuthManager();
