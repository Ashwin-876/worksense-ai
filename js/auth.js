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

class AuthManager {
  constructor() {
    this.roles = ['SUPER_ADMIN', 'EMPLOYEE_AKASH', 'EMPLOYEE_KANISHKA', 'EMPLOYEE_KARTIK'];
  }

  getCurrentRole() {
    return window.appState ? window.appState.currentRole : 'SUPER_ADMIN';
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

  switchRole(roleKey) {
    if (window.appState) {
      window.appState.setRole(roleKey);
    }
  }
}

window.authManager = new AuthManager();
