// WorkSense AI - Role-Based Access Control (RBAC) & Authentication Module

const PERMISSIONS = {
  ADMIN: [
    'view_overview', 'view_monitoring', 'view_cameras', 'manage_cameras',
    'view_employees', 'manage_employees', 'view_attendance', 'manage_attendance',
    'view_alerts', 'manage_alerts', 'view_analytics', 'export_reports',
    'view_audit_logs', 'manage_settings', 'view_privacy'
  ],
  MANAGER: [
    'view_overview', 'view_monitoring', 'view_cameras',
    'view_employees', 'view_attendance', 'manage_attendance',
    'view_alerts', 'manage_alerts', 'view_analytics', 'export_reports',
    'view_privacy'
  ],
  HR: [
    'view_overview', 'view_employees', 'manage_employees',
    'view_attendance', 'manage_attendance', 'view_alerts', 'manage_alerts',
    'view_analytics', 'export_reports', 'view_audit_logs', 'view_privacy'
  ],
  EMPLOYEE: [
    'view_overview', 'view_monitoring', 'view_attendance', 'view_privacy'
  ]
};

class AuthManager {
  constructor() {
    this.roles = ['ADMIN', 'MANAGER', 'HR', 'EMPLOYEE'];
  }

  getCurrentRole() {
    return window.appState ? window.appState.currentRole : 'ADMIN';
  }

  getCurrentUser() {
    return window.appState ? window.appState.currentUser : { name: 'Admin', role: 'ADMIN' };
  }

  hasPermission(permission) {
    const role = this.getCurrentRole();
    const allowed = PERMISSIONS[role] || [];
    return allowed.includes(permission);
  }

  switchRole(newRole) {
    if (!this.roles.includes(newRole)) return;
    if (window.appState) {
      window.appState.setRole(newRole);
    }
  }
}

window.authManager = new AuthManager();

