// WorkSense AI - Main Application Controller & View Orchestrator

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

let currentView = 'overview';
let liveTelemetry = null;
let liveSessionLogs = [];
let fpsCounterValue = 0;
let lastFpsCheck = performance.now();
let framesThisSecond = 0;

function syncLoginThemeToggle() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const moonBtn = document.getElementById('theme-btn-moon');
  const sunBtn = document.getElementById('theme-btn-sun');
  if (moonBtn && sunBtn) {
    if (currentTheme === 'dark') {
      moonBtn.classList.add('active');
      sunBtn.classList.remove('active');
    } else {
      sunBtn.classList.add('active');
      moonBtn.classList.remove('active');
    }
  }
}

function showLoginScreen(message = null) {
  const loginScreen = document.getElementById('login-screen');
  const appLayout = document.getElementById('app-layout');
  if (loginScreen) {
    loginScreen.classList.remove('hidden');
    loginScreen.style.display = 'flex';
  }
  if (appLayout) {
    appLayout.style.display = 'none';
  }
  const alertBox = document.getElementById('login-alert-box');
  if (alertBox) {
    if (message) {
      alertBox.textContent = message;
      alertBox.className = 'login-alert-banner alert-info show';
    } else {
      alertBox.className = 'login-alert-banner';
    }
  }
  syncLoginThemeToggle();
}

function showDashboard() {
  const loginScreen = document.getElementById('login-screen');
  const appLayout = document.getElementById('app-layout');
  if (loginScreen) {
    loginScreen.classList.add('hidden');
    loginScreen.style.display = 'none';
  }
  if (appLayout) {
    appLayout.style.display = 'flex';
  }
  // Sync role select and badges
  const roleSelect = document.getElementById('role-selector');
  if (roleSelect && window.authManager) {
    roleSelect.value = window.authManager.getCurrentRoleKey();
  }
  applyRolePermissions();
  renderCurrentView();
}

function handleLogout() {
  if (window.alertManager) {
    window.alertManager.stopAbsenceAlarm();
  }
  if (window.aiEngine && window.aiEngine.isRunning) {
    try {
      window.aiEngine.stop();
    } catch (e) {
      console.warn("Error stopping AI engine on logout:", e);
    }
  }
  if (window.authManager) {
    window.authManager.logout();
  }
  showLoginScreen("You have been logged out successfully. Choose an account below or sign in to continue.");
}
window.handleLogout = handleLogout;

function setupAuthUI() {
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const alertBox = document.getElementById('login-alert-box');
  const passwordToggle = document.getElementById('login-password-toggle');
  const passwordToggleIcon = document.getElementById('password-toggle-icon');
  const submitBtn = document.getElementById('login-submit-btn');
  const submitBtnText = document.getElementById('submit-btn-text');
  const forgotLink = document.getElementById('login-forgot-link');

  // Tab controls
  const tabAccount = document.getElementById('btn-tab-account');
  const tabQuick = document.getElementById('btn-tab-quick');
  let currentLoginMode = 'account';

  function setLoginTab(mode) {
    currentLoginMode = mode;
    if (mode === 'quick') {
      if (tabQuick) {
        tabQuick.classList.add('active');
        tabQuick.setAttribute('aria-selected', 'true');
      }
      if (tabAccount) {
        tabAccount.classList.remove('active');
        tabAccount.setAttribute('aria-selected', 'false');
      }
      if (submitBtnText) submitBtnText.textContent = '⚡ Instant Quick Login';
      if (alertBox) {
        alertBox.textContent = '⚡ Quick Login Mode: Click any staff card below to sign in instantly.';
        alertBox.className = 'login-alert-banner alert-info show';
      }
    } else {
      if (tabAccount) {
        tabAccount.classList.add('active');
        tabAccount.setAttribute('aria-selected', 'true');
      }
      if (tabQuick) {
        tabQuick.classList.remove('active');
        tabQuick.setAttribute('aria-selected', 'false');
      }
      if (submitBtnText) submitBtnText.textContent = 'Sign In to WorkSense AI';
      if (alertBox) {
        alertBox.className = 'login-alert-banner';
      }
    }
  }

  if (tabAccount) tabAccount.addEventListener('click', () => setLoginTab('account'));
  if (tabQuick) tabQuick.addEventListener('click', () => setLoginTab('quick'));

  // Password visibility toggle
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      if (passwordToggleIcon) {
        passwordToggleIcon.textContent = isPassword ? '🙈' : '👁️';
      }
    });
  }

  // Theme toggle on login screen
  const moonBtn = document.getElementById('theme-btn-moon');
  const sunBtn = document.getElementById('theme-btn-sun');

  if (moonBtn) {
    moonBtn.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('worksense_theme', 'dark');
      syncLoginThemeToggle();
    });
  }

  if (sunBtn) {
    sunBtn.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('worksense_theme', 'light');
      syncLoginThemeToggle();
    });
  }
  syncLoginThemeToggle();

  // Form submit handler
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const identifier = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

      const res = window.authManager.login(identifier, password);
      if (res.success) {
        if (alertBox) alertBox.className = 'login-alert-banner';
        showDashboard();
      } else {
        if (alertBox) {
          alertBox.textContent = res.error;
          alertBox.className = 'login-alert-banner alert-error show';
        }
      }
    });
  }

  // Quick Staff Cards (4 Cards)
  const staffCards = document.querySelectorAll('.quick-staff-card');
  staffCards.forEach(card => {
    function activateStaffCard(autoSubmit = false) {
      staffCards.forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');

      const email = card.getAttribute('data-email');
      const password = card.getAttribute('data-password');
      const roleKey = card.getAttribute('data-role');

      if (usernameInput) usernameInput.value = email;
      if (passwordInput) passwordInput.value = password;

      if (autoSubmit || currentLoginMode === 'quick') {
        const res = window.authManager.quickLogin(roleKey);
        if (res.success) {
          showDashboard();
          return;
        }
      }

      if (alertBox) {
        alertBox.textContent = `Selected: ${card.querySelector('.staff-card-name')?.textContent || email}. Click "Sign In" to enter.`;
        alertBox.className = 'login-alert-banner alert-info show';
      }
    }

    card.addEventListener('click', () => {
      activateStaffCard(currentLoginMode === 'quick');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateStaffCard(true);
      }
    });
  });

  // Forgot Password Link
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (alertBox) {
        alertBox.innerHTML = `<strong>Password Assistance:</strong> Contact Super Admin <strong>Anandhi C</strong> (EMP-1001) or click any staff card below to sign in with pre-configured access credentials.`;
        alertBox.className = 'login-alert-banner alert-info show';
      }
    });
  }

  // Logout Handlers (Topbar, Sidebar nav item, Sidebar footer, User pill)
  const logoutBtn = document.getElementById('logout-btn');
  const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
  const navLogoutBtn = document.getElementById('nav-logout-btn');
  const userPill = document.getElementById('user-pill-container');

  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', handleLogout);
  if (navLogoutBtn) navLogoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
  });
  if (userPill) userPill.addEventListener('click', handleLogout);
}

function initApp() {
  // Bind navigation
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      if (targetView === 'logout' || item.id === 'nav-logout-btn') {
        handleLogout();
        return;
      }
      if (targetView) {
        navigateToView(targetView);
      }
    });
  });

  // Bind Role Switcher in Sidebar (Native select)
  const roleSelect = document.getElementById('role-selector');
  if (roleSelect) {
    roleSelect.value = (window.appState && window.appState.currentRoleKey) ? window.appState.currentRoleKey : window.authManager.getCurrentRole();
    roleSelect.addEventListener('change', (e) => {
      if (e.target.value === 'LOGOUT') {
        handleLogout();
        return;
      }
      window.authManager.switchRole(e.target.value);
      applyRolePermissions();
      renderCurrentView();
    });
  }

  // Bind Sidebar Account Card Trigger and Popover
  const accountTrigger = document.getElementById('account-dropdown-trigger');
  const accountPopover = document.getElementById('account-popover-menu');
  const accountChevron = document.querySelector('.account-chevron');

  if (accountTrigger && accountPopover) {
    accountTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = accountPopover.classList.contains('hidden');
      accountPopover.classList.toggle('hidden', !isHidden);
      if (accountChevron) accountChevron.classList.toggle('open', isHidden);
    });

    document.addEventListener('click', (e) => {
      if (!accountTrigger.contains(e.target) && !accountPopover.contains(e.target)) {
        accountPopover.classList.add('hidden');
        if (accountChevron) accountChevron.classList.remove('open');
      }
    });

    accountPopover.querySelectorAll('.popover-item[data-role]').forEach(item => {
      item.addEventListener('click', () => {
        const targetRole = item.getAttribute('data-role');
        accountPopover.classList.add('hidden');
        if (accountChevron) accountChevron.classList.remove('open');
        window.authManager.switchRole(targetRole);
        applyRolePermissions();
        renderCurrentView();
      });
    });

    const popoverLogout = document.getElementById('popover-logout-btn');
    if (popoverLogout) {
      popoverLogout.addEventListener('click', () => {
        accountPopover.classList.add('hidden');
        handleLogout();
      });
    }
  }

  // Sidebar collapse & mobile drawer toggle
  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const appLayoutEl = document.querySelector('.app-layout');
  
  const handleToggleSidebar = () => {
    if (appLayoutEl) {
      if (window.innerWidth <= 768) {
        appLayoutEl.classList.toggle('sidebar-mobile-open');
      } else {
        appLayoutEl.classList.toggle('sidebar-collapsed');
      }
    }
  };

  if (collapseBtn) collapseBtn.addEventListener('click', () => {
    if (appLayoutEl) {
      if (window.innerWidth <= 768) {
        appLayoutEl.classList.remove('sidebar-mobile-open');
      } else {
        appLayoutEl.classList.toggle('sidebar-collapsed');
      }
    }
  });

  if (toggleBtn) toggleBtn.addEventListener('click', handleToggleSidebar);

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      if (appLayoutEl) appLayoutEl.classList.remove('sidebar-mobile-open');
    });
  }

  // Auto-close mobile drawer when navigation link is clicked
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768 && appLayoutEl) {
        appLayoutEl.classList.remove('sidebar-mobile-open');
      }
    });
  });

  // Bind Dashboard Theme Toggle
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('worksense_theme', next);
      syncLoginThemeToggle();
    });
    const saved = localStorage.getItem('worksense_theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      syncLoginThemeToggle();
    }
  }

  // Hook AI Engine Callbacks
  if (window.aiEngine) {
    window.aiEngine.onTelemetryUpdate = handleTelemetryUpdate;
    window.aiEngine.onAlertTriggered = handleAlertTriggered;
    window.aiEngine.onStatusChanged = handleStatusChanged;
  }

  // Hook Camera Manager Callbacks
  if (window.cameraManager) {
    window.cameraManager.onCameraDisconnected = (deviceId) => {
      if (window.alertManager) {
        window.alertManager.dispatchAlert({
          type: 'CAMERA_OFFLINE',
          severity: 'Critical',
          employeeId: 'SYS',
          employeeName: 'System Monitor',
          camera: 'CAM-01',
          description: 'Primary camera connection lost or device unplugged.',
          xaiSummary: 'Hardware video capture stream abruptly terminated without software shutdown.'
        });
      }
      renderAlertsBadge();
    };
  }

  // Initialize Camera Hardware Selection
  populateCameraDevices();

  // Setup Authentication & Login Handlers
  setupAuthUI();

  // Restore session or display login screen
  const activeUser = window.authManager.initSession();
  if (activeUser || window.authManager.isAuthenticated()) {
    showDashboard();
  } else {
    showLoginScreen();
  }

  // Apply RBAC permissions to navigation
  applyRolePermissions();

  // Initial View Render
  navigateToView('overview');
  renderAlertsBadge();
}

function applyRolePermissions() {
  const role = window.authManager.getCurrentRole();
  const roleBadge = document.getElementById('current-role-badge');
  if (roleBadge) {
    roleBadge.textContent = role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : role;
    roleBadge.className = `badge-role role-${role.toLowerCase()}`;
  }

  // Filter sidebar items according to permissions
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const perm = item.getAttribute('data-perm');
    if (perm && !window.authManager.hasPermission(perm)) {
      item.style.display = 'none';
    } else {
      item.style.display = 'flex';
    }
  });

  const userDisplayName = document.getElementById('user-display-name');
  const userDisplayRole = document.getElementById('user-display-role');
  const userAvatar = document.getElementById('topbar-user-avatar');
  const sidebarAccountName = document.getElementById('sidebar-account-name');
  const sidebarAccountRole = document.getElementById('sidebar-account-role');

  if (window.appState && window.appState.currentUser) {
    const user = window.appState.currentUser;
    const cleanName = user.name.split(' (')[0];
    const roleTitle = user.role === 'SUPER_ADMIN' ? 'Super Admin' : (user.designation || 'Staff');
    
    if (userDisplayName) userDisplayName.textContent = cleanName;
    if (userDisplayRole) userDisplayRole.textContent = roleTitle;
    if (sidebarAccountName) sidebarAccountName.textContent = cleanName;
    if (sidebarAccountRole) sidebarAccountRole.textContent = roleTitle;

    if (userAvatar) {
      const parts = cleanName.split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : cleanName.substring(0, 2).toUpperCase();
      userAvatar.textContent = initials;
    }
  }

  // Update active item in popover and sync select
  const currentKey = window.authManager.getCurrentRoleKey();
  const roleSelect = document.getElementById('role-selector');
  if (roleSelect) roleSelect.value = currentKey;

  document.querySelectorAll('.popover-item[data-role]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-role') === currentKey);
  });
}

function acknowledgeAlertRow(alertId, btnEl) {
  if (window.appState) {
    window.appState.acknowledgeAlert(alertId);
  }
  if (btnEl) {
    const row = btnEl.closest('tr');
    if (row) {
      const statusCell = row.querySelector('.pill-status');
      if (statusCell) {
        statusCell.textContent = 'Acknowledged';
        statusCell.className = 'pill-status text-success';
      }
    }
    btnEl.textContent = 'View';
    btnEl.onclick = () => navigateToView('alerts');
  }
  renderAlertsBadge();
}
window.acknowledgeAlertRow = acknowledgeAlertRow;

function navigateToView(viewName) {
  currentView = viewName;
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  const viewPanels = document.querySelectorAll('.view-panel');
  viewPanels.forEach(panel => {
    if (panel.id === `view-${viewName}`) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  });

  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    const titles = {
      overview: 'Executive Dashboard',
      monitoring: 'Live Computer Vision Monitoring',
      cameras: 'Multi-Camera Monitoring Grid',
      employees: 'Staff & Personnel Directory',
      attendance: 'Attendance Management & Duration Logs',
      alerts: 'Smart Automated Incident Center',
      analytics: 'Workstation & Focus Analytics',
      reports: 'Compliance Reports & Data Exports',
      privacy: 'Privacy Framework & Audit Logs',
      settings: 'System Configuration & Policy Thresholds',
      departments: 'Department Performance & Index',
      workstations: 'Workstation Hardware & Utilization'
    };
    pageTitle.textContent = titles[viewName] || 'Executive Dashboard';
  }

  renderCurrentView();
}

function renderCurrentView() {
  switch (currentView) {
    case 'overview': renderOverviewView(); break;
    case 'monitoring': renderMonitoringView(); break;
    case 'cameras': renderCamerasView(); break;
    case 'employees': renderEmployeesView(); break;
    case 'attendance': renderAttendanceView(); break;
    case 'alerts': renderAlertsView(); break;
    case 'analytics': renderAnalyticsView(); break;
    case 'reports': renderReportsView(); break;
    case 'privacy': renderPrivacyView(); break;
    case 'settings': renderSettingsView(); break;
    case 'departments': renderAnalyticsView(); break;
    case 'workstations': renderCamerasView(); break;
  }
}

function renderAlertsBadge() {
  const badge = document.getElementById('sidebar-alert-badge');
  const topbarBadge = document.getElementById('topbar-alert-count');
  const count = window.alertManager ? window.alertManager.getUnacknowledgedCount() : 2;
  
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
  if (topbarBadge) {
    topbarBadge.textContent = count;
    topbarBadge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// -------------------------------------------------------------
// View 1: Overview Dashboard
// -------------------------------------------------------------
function renderOverviewView() {
  const kpis = window.analyticsEngine ? window.analyticsEngine.getOverviewKPIs() : {
    totalStaff: 8,
    presentStaff: 7,
    attendanceRate: 88,
    unackAlerts: 4,
    drowsinessEvents: 2,
    activeWorkstations: 8,
    avgScore: 87
  };
  
  const totalStaffEl = document.getElementById('kpi-total-staff');
  const attendanceRateEl = document.getElementById('kpi-attendance-rate');
  const alertsCountEl = document.getElementById('kpi-alerts-count');
  const avgScoreEl = document.getElementById('kpi-avg-score');
  const activeWsEl = document.getElementById('kpi-active-ws');
  const drowsinessEl = document.getElementById('kpi-drowsiness-count');

  if (totalStaffEl) totalStaffEl.textContent = kpis.totalStaff;
  if (attendanceRateEl) {
    attendanceRateEl.textContent = `${kpis.attendanceRate}%`;
    const subEl = attendanceRateEl.closest('.kpi-card-v2')?.querySelector('.kpi-v2-sub');
    if (subEl) subEl.textContent = `${kpis.presentStaff} of ${kpis.totalStaff} checked in`;
  }
  if (alertsCountEl) alertsCountEl.textContent = kpis.unackAlerts;
  if (avgScoreEl) avgScoreEl.textContent = `${kpis.avgScore}%`;
  if (activeWsEl) activeWsEl.textContent = kpis.activeWorkstations;
  if (drowsinessEl) drowsinessEl.textContent = kpis.drowsinessEvents;

  // Sync Attendance Distribution Donut & Legend
  const attCenterTotal = document.getElementById('overview-att-total-center');
  if (attCenterTotal) attCenterTotal.textContent = kpis.totalStaff;
  
  const attPresentVal = document.getElementById('overview-att-present-val');
  if (attPresentVal) attPresentVal.textContent = `${kpis.presentStaff} (${kpis.attendanceRate}%)`;
  
  const attLeaveVal = document.getElementById('overview-att-leave-val');
  if (attLeaveVal) {
    const checkedOutCount = Math.max(0, kpis.totalStaff - kpis.presentStaff);
    const leavePct = Math.round((checkedOutCount / kpis.totalStaff) * 100);
    attLeaveVal.textContent = `${checkedOutCount} (${leavePct}%)`;
  }

  renderAlertsBadge();
  renderRecentAlertsOverview();
}

function renderRecentAlertsOverview() {
  const tbody = document.getElementById('recent-alerts-tbody');
  if (!tbody || !window.appState) return;

  const alerts = window.appState.alerts || [];
  if (alerts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:#94a3b8;">No recent incident alerts</td></tr>`;
    return;
  }

  const categoryIcons = {
    DROWSINESS: { icon: '💤', colorClass: 'text-purple' },
    POSTURE: { icon: '🧘', colorClass: 'text-warning' },
    ABSENCE: { icon: '🖥️', colorClass: 'text-primary' },
    DISTRACTION: { icon: '📱', colorClass: 'text-warning' },
    TALKING: { icon: '💬', colorClass: 'text-teal' },
    MULTIPLE_FACES: { icon: '👥', colorClass: 'text-danger' },
    LOW_LIGHTING: { icon: '💡', colorClass: 'text-warning' }
  };

  const severityPills = {
    Critical: 'pill-danger',
    Warning: 'pill-warning',
    Info: 'pill-info'
  };

  const topAlerts = alerts.slice(0, 5);
  tbody.innerHTML = topAlerts.map((a, idx) => {
    const cat = categoryIcons[a.type] || { icon: '⚠️', colorClass: 'text-warning' };
    const sevClass = severityPills[a.severity] || 'pill-info';
    const isAck = a.status === 'Acknowledged';
    const dateObj = new Date(a.timestamp);
    const timeFormatted = isNaN(dateObj.getTime()) ? 'Just now' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return `
      <tr>
        <td>${idx + 1}</td>
        <td><span class="tbl-user-icon">👤</span> <strong>${a.employeeName}</strong></td>
        <td><span class="cat-icon ${cat.colorClass}">${cat.icon}</span> ${a.type.replace('_', ' ')}</td>
        <td style="max-width: 280px; white-space: normal;">${a.description}</td>
        <td>Today, ${timeFormatted}</td>
        <td><span class="pill-badge ${sevClass}">${a.severity}</span></td>
        <td><span class="pill-status ${isAck ? 'text-success' : 'text-danger'}">${a.status}</span></td>
        <td style="text-align: right;">
          ${isAck ? `
            <button class="btn-action-outline" onclick="navigateToView('alerts')">View</button>
          ` : `
            <button class="btn-action-outline" onclick="acknowledgeAlertRow('${a.id}', this)">Acknowledge</button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// View 2: Live Monitoring (Webcam & Advanced AI)
// -------------------------------------------------------------
function renderMonitoringView() {
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const placeholder = document.getElementById('camera-placeholder');
  const hud = document.getElementById('hud-overlay');

  if (startBtn && stopBtn) {
    startBtn.onclick = async () => {
      try {
        startBtn.disabled = true;
        startBtn.textContent = 'Starting...';
        const camSelect = document.getElementById('monitoring-camera-select');
        const deviceId = camSelect ? camSelect.value : null;

        await window.aiEngine.start(document.getElementById('webcam'), deviceId);

        startBtn.disabled = true;
        startBtn.textContent = '▶ Monitoring Live';
        stopBtn.disabled = false;
        if (placeholder) placeholder.classList.add('hidden');
        if (hud) hud.classList.remove('hidden');

        const pill = document.getElementById('system-status-pill');
        if (pill) {
          pill.textContent = 'Live Feed Active';
          pill.className = 'status-pill status-live';
        }
      } catch (err) {
        alert("Camera start error: " + err.message);
        startBtn.disabled = false;
        startBtn.textContent = '▶ Start Monitoring';
      }
    };

    stopBtn.onclick = () => {
      if (window.alertManager) {
        window.alertManager.stopAbsenceAlarm();
      }
      const hudAlarm = document.getElementById('hud-alarm-indicator');
      if (hudAlarm) hudAlarm.classList.add('hidden');

      window.aiEngine.stop();
      startBtn.disabled = false;
      startBtn.textContent = '▶ Start Monitoring';
      stopBtn.disabled = true;
      if (placeholder) placeholder.classList.remove('hidden');
      if (hud) hud.classList.add('hidden');

      const pill = document.getElementById('system-status-pill');
      if (pill) {
        pill.textContent = 'System Ready';
        pill.className = 'status-pill status-ready';
      }
    };
  }

  // Privacy Blur Mode
  const blurCheck = document.getElementById('check-privacy-blur');
  if (blurCheck && window.appState) {
    blurCheck.checked = window.appState.settings.privacyBlurMode;
    blurCheck.onchange = (e) => {
      window.privacyManager.togglePrivacyBlur(e.target.checked);
    };
  }

  // Draw face mesh toggle
  const meshCheck = document.getElementById('check-draw-mesh');
  if (meshCheck && window.appState) {
    meshCheck.checked = window.appState.settings.drawFaceMesh;
    meshCheck.onchange = (e) => {
      window.appState.updateSettings({ drawFaceMesh: e.target.checked });
    };
  }

  // Absence Alarm Sound Toggle
  const alarmCheck = document.getElementById('check-absence-alarm');
  if (alarmCheck && window.appState) {
    alarmCheck.checked = window.appState.settings.soundAlerts;
    alarmCheck.onchange = (e) => {
      window.appState.updateSettings({ soundAlerts: e.target.checked });
      if (!e.target.checked && window.alertManager) {
        window.alertManager.stopAbsenceAlarm();
      }
    };
  }

  // Absence Alarm Sound Theme Selector
  const soundSelect = document.getElementById('select-alarm-sound');
  if (soundSelect && window.appState) {
    soundSelect.value = window.appState.settings.soundAlertTheme || 'voice';
    soundSelect.onchange = (e) => {
      window.appState.updateSettings({ soundAlertTheme: e.target.value });
      const cfgSound = document.getElementById('cfg-alarm-sound');
      if (cfgSound) cfgSound.value = e.target.value;
      if (window.alertManager) {
        window.alertManager.playAlarmPulse(e.target.value);
      }
    };
  }

  // Preview / Test Sound Button
  const testSoundBtn = document.getElementById('btn-test-sound');
  if (testSoundBtn && window.alertManager) {
    testSoundBtn.onclick = () => {
      const selectedTheme = soundSelect ? soundSelect.value : 'voice';
      window.alertManager.playAlarmPulse(selectedTheme);
    };
  }

  renderLiveSessionLogs();
}

function handleTelemetryUpdate(data) {
  liveTelemetry = data;

  // FPS calculation
  framesThisSecond++;
  const now = performance.now();
  if (now - lastFpsCheck >= 1000) {
    fpsCounterValue = Math.round((framesThisSecond * 1000) / (now - lastFpsCheck));
    framesThisSecond = 0;
    lastFpsCheck = now;
    const fpsBadge = document.getElementById('fps-counter');
    if (fpsBadge) fpsBadge.textContent = `${fpsCounterValue} FPS`;
  }

  // Update In-Video HUD
  const hudPresence = document.getElementById('hud-presence');
  const hudEye = document.getElementById('hud-eye');
  const hudMouth = document.getElementById('hud-mouth');
  const hudTalk = document.getElementById('hud-talk-events');
  const hudStatus = document.getElementById('hud-status');
  const hudEyeTimer = document.getElementById('hud-eye-timer');
  const hudAbsenceTimer = document.getElementById('hud-absence-timer');

  if (hudPresence) {
    hudPresence.textContent = `Presence: ${data.present ? "Present" : "Absent"}`;
    hudPresence.style.color = data.present ? "#00ff00" : "#ff4444";
  }
  if (hudEye) hudEye.textContent = `Eye: ${data.eyeStatus} (EAR: ${data.ear.toFixed(2)})`;
  if (hudMouth) hudMouth.textContent = `Mouth: ${data.mouthStatus} (MAR: ${data.mar.toFixed(3)})`;
  if (hudTalk) hudTalk.textContent = `Talk Events: ${data.talkingFrequency}/${data.talkFrequencyThreshold}`;
  if (hudStatus) {
    hudStatus.textContent = `Status: ${data.workingStatus}`;
    hudStatus.style.color = data.workingStatus === "Working" ? "#00ffff" : "#ff4444";
  }

  if (hudEyeTimer) {
    if (data.continuousEyeClosed) {
      hudEyeTimer.classList.remove('hidden');
      hudEyeTimer.textContent = `Eyes Closed: ${Math.round(data.eyeClosureDuration)}s / ${data.eyeClosureThreshold}s`;
    } else {
      hudEyeTimer.classList.add('hidden');
    }
  }

  if (hudAbsenceTimer) {
    if (!data.present) {
      hudAbsenceTimer.classList.remove('hidden');
      hudAbsenceTimer.textContent = `Absent: ${Math.round(data.absenceDuration)}s / ${data.absenceThreshold}s`;
    } else {
      hudAbsenceTimer.classList.add('hidden');
    }
  }

  // Handle Absence Alarm Sound when no person is detected
  const hudAlarm = document.getElementById('hud-alarm-indicator');
  if (window.aiEngine && window.aiEngine.isRunning) {
    if (!data.present) {
      if (window.alertManager) {
        window.alertManager.startAbsenceAlarm();
      }
      if (hudAlarm) hudAlarm.classList.remove('hidden');
    } else {
      if (window.alertManager) {
        window.alertManager.stopAbsenceAlarm();
      }
      if (hudAlarm) hudAlarm.classList.add('hidden');
    }
  } else {
    if (window.alertManager) {
      window.alertManager.stopAbsenceAlarm();
    }
    if (hudAlarm) hudAlarm.classList.add('hidden');
  }

  // Update Telemetry Cards
  const valPresence = document.getElementById('metric-presence');
  const valEye = document.getElementById('metric-eye');
  const valEar = document.getElementById('metric-ear');
  const valMouth = document.getElementById('metric-mouth');
  const valMar = document.getElementById('metric-mar');
  const valYawn = document.getElementById('metric-yawn');
  const valPose = document.getElementById('metric-head-pose');
  const valPosture = document.getElementById('metric-posture');
  const valTalkEvents = document.getElementById('metric-talk-events');
  const valWorking = document.getElementById('metric-working-status');
  const valXAI = document.getElementById('metric-xai-summary');

  if (valPresence) {
    valPresence.textContent = data.present ? "Present" : "Absent";
    valPresence.className = `metric-value ${data.present ? 'badge-present' : 'badge-absent'}`;
  }
  if (valEye) valEye.textContent = data.eyeStatus;
  if (valEar) valEar.textContent = `EAR: ${data.ear.toFixed(2)}`;
  if (valMouth) valMouth.textContent = data.mouthStatus;
  if (valMar) valMar.textContent = `MAR: ${data.mar.toFixed(3)}`;
  if (valYawn) {
    valYawn.textContent = `${data.yawnCount}${data.isYawning ? ' (YAWNING)' : ''}`;
    valYawn.style.color = data.isYawning ? 'var(--color-danger)' : 'inherit';
  }
  if (valPose) {
    valPose.textContent = `P: ${data.headPose.pitch}° | Y: ${data.headPose.yaw}° | R: ${data.headPose.roll}°`;
  }
  if (valPosture) {
    valPosture.textContent = data.posture.status;
    valPosture.className = `metric-value ${data.posture.status === 'Good Posture' ? 'badge-working' : 'badge-absent'}`;
  }
  if (valTalkEvents) valTalkEvents.textContent = `${data.talkingFrequency} / ${data.talkFrequencyThreshold}`;
  if (valWorking) {
    valWorking.textContent = data.workingStatus;
    valWorking.className = `metric-value ${data.workingStatus === "Working" ? 'badge-working' : 'badge-not-working'}`;
  }
  if (valXAI) valXAI.textContent = data.xaiSummary;
}

function handleAlertTriggered(alertData) {
  if (window.alertManager) {
    const user = window.appState ? window.appState.currentUser : { id: 'EMP-1001', name: 'Anandhi C' };
    window.alertManager.dispatchAlert({
      employeeId: user.id || 'EMP-1001',
      employeeName: user.name.split(' (')[0] || 'Anandhi C',
      camera: 'CAM-01',
      ...alertData
    });
  }
  renderAlertsBadge();
}

function handleStatusChanged(sessionData) {
  const logItem = {
    date: new Date(sessionData.startTime * 1000).toISOString().split('T')[0],
    startTime: new Date(sessionData.startTime * 1000).toTimeString().split(' ')[0],
    endTime: new Date(sessionData.endTime * 1000).toTimeString().split(' ')[0],
    duration: sessionData.duration,
    status: sessionData.status,
    xaiSummary: sessionData.xaiSummary
  };
  liveSessionLogs.unshift(logItem);
  renderLiveSessionLogs();
}

function renderLiveSessionLogs() {
  const tbody = document.getElementById('session-log-body');
  if (!tbody) return;

  if (liveSessionLogs.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">No live sessions recorded yet. Start camera monitoring to capture status transitions.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = liveSessionLogs.map(l => `
    <tr>
      <td>${l.date}</td>
      <td>${l.startTime}</td>
      <td>${l.endTime}</td>
      <td>${l.duration}s</td>
      <td>
        <span class="status-badge ${l.status.trim() === 'Working' ? 'status-badge-working' : 'status-badge-not-working'}">
          ${l.status}
        </span>
      </td>
      <td class="xai-cell" title="${l.xaiSummary}">${l.xaiSummary || 'Normal'}</td>
    </tr>
  `).join('');
}

async function populateCameraDevices() {
  const select = document.getElementById('monitoring-camera-select');
  if (!select || !window.cameraManager) return;

  const devices = await window.cameraManager.getAvailableDevices();
  select.innerHTML = '';
  
  if (devices.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Default System Camera';
    select.appendChild(opt);
  } else {
    devices.forEach((d, idx) => {
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `Camera ${idx + 1}`;
      select.appendChild(opt);
    });
  }
}

// -------------------------------------------------------------
// View 3: Multi-Camera Grid
// -------------------------------------------------------------
function renderCamerasView() {
  const grid = document.getElementById('camera-grid-container');
  if (!grid || !window.appState) return;

  const cameras = window.appState.cameras;
  const employees = window.appState.employees;

  grid.innerHTML = cameras.map(cam => {
    const assignedEmp = employees.find(e => e.id === cam.assignedEmployeeId);
    return `
      <div class="camera-grid-card">
        <div class="camera-card-top">
          <div class="camera-meta">
            <strong>${cam.name}</strong>
            <span class="camera-loc">${cam.location}</span>
          </div>
          <span class="badge-tag ${cam.status.toLowerCase()}">${cam.status}</span>
        </div>
        <div class="camera-preview-box">
          ${cam.isHardware ? `
            <div class="live-hardware-tag">🔴 LIVE HARDWARE CAM</div>
            <div class="simulated-feed">Active Video Device Connected</div>
          ` : `
            <div class="rtsp-tag">RTSP STREAM</div>
            <div class="simulated-feed">Simulated IP Stream • ${cam.resolution}</div>
          `}
        </div>
        <div class="camera-footer">
          <div class="camera-assigned">
            <span>Assigned:</span>
            <strong>${assignedEmp ? assignedEmp.name : 'Unassigned'}</strong>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="openAssignModal('${cam.id}')">Assign</button>
        </div>
      </div>
    `;
  }).join('');
}

window.openAssignModal = function(cameraId) {
  const empId = prompt("Enter Employee ID to assign (e.g. EMP-1002):");
  if (empId && window.cameraManager) {
    window.cameraManager.assignEmployeeToCamera(cameraId, empId.trim());
    renderCamerasView();
  }
};

// -------------------------------------------------------------
// View 4: Employee Management
// -------------------------------------------------------------
function renderEmployeesView() {
  const container = document.getElementById('employee-list-container');
  if (!container || !window.appState) return;

  const employees = window.appState.employees;
  const filterDept = document.getElementById('employee-dept-filter');
  const selectedDept = filterDept ? filterDept.value : 'All';

  const filtered = selectedDept === 'All' ? employees : employees.filter(e => e.department === selectedDept);

  container.innerHTML = filtered.map(emp => `
    <div class="employee-card">
      <div class="emp-card-header">
        <div class="emp-avatar">${emp.avatar}</div>
        <div class="emp-info">
          <h3>${emp.name}</h3>
          <span class="emp-desig">${emp.designation}</span>
        </div>
        <span class="status-badge ${emp.status === 'Active' ? 'status-badge-working' : 'status-badge-not-working'}">
          ${emp.status}
        </span>
      </div>
      <div class="emp-details-grid">
        <div class="emp-detail-item"><span>ID:</span> <strong>${emp.id}</strong></div>
        <div class="emp-detail-item"><span>Department:</span> <strong>${emp.department}</strong></div>
        <div class="emp-detail-item"><span>Workstation:</span> <strong>${emp.workstation}</strong></div>
        <div class="emp-detail-item"><span>Camera:</span> <strong>${emp.cameraAssigned}</strong></div>
        <div class="emp-detail-item"><span>Email:</span> <strong>${emp.email}</strong></div>
        <div class="emp-detail-item"><span>Phone:</span> <strong>${emp.phone || 'N/A'}</strong></div>
      </div>
      <div class="emp-card-actions">
        <button class="btn btn-sm btn-secondary" onclick="viewEmployeeHistory('${emp.id}')">View History</button>
        ${window.authManager.hasPermission('manage_employees') ? `
          <button class="btn btn-sm btn-outline" onclick="deleteEmployeeRecord('${emp.id}')">Delete</button>
        ` : ''}
      </div>
    </div>
  `).join('');

  const addBtn = document.getElementById('add-employee-btn');
  if (addBtn) {
    addBtn.style.display = window.authManager.hasPermission('manage_employees') ? 'inline-flex' : 'none';
    addBtn.onclick = () => {
      const name = prompt("Enter Full Name:");
      if (!name) return;
      const dept = prompt("Enter Department (Engineering, Product Design, Customer Support, Operations, Human Resources):", "Engineering");
      const desig = prompt("Enter Designation:", "Software Engineer");
      const ws = prompt("Enter Workstation ID:", "WS-07");
      const email = prompt("Enter Work Email:", `${name.toLowerCase().replace(/\s+/g, '.')}@worksense.ai`);

      window.appState.addEmployee({
        name,
        department: dept || 'Engineering',
        designation: desig || 'Staff',
        workstation: ws || 'WS-01',
        email: email || 'user@worksense.ai',
        cameraAssigned: 'None',
        status: 'Active'
      });
      renderEmployeesView();
    };
  }
}

window.deleteEmployeeRecord = function(id) {
  if (confirm(`Are you sure you want to delete employee record ${id}?`)) {
    window.appState.deleteEmployee(id);
    renderEmployeesView();
  }
};

window.viewEmployeeHistory = function(id) {
  const emp = window.appState.employees.find(e => e.id === id);
  const att = window.appState.attendance.find(a => a.employeeId === id);
  const alerts = window.appState.alerts.filter(a => a.employeeId === id);
  
  alert(`Employee History: ${emp.name} (${emp.id})\n` +
        `Department: ${emp.department}\n` +
        `Attendance: ${att ? att.status : 'N/A'} (Check-in: ${att ? att.checkIn : 'None'})\n` +
        `Total Incident Alerts: ${alerts.length}\n` +
        `Consent Signed: ${emp.consentSigned ? 'YES' : 'NO'}`);
};

// -------------------------------------------------------------
// View 5: Attendance Hub
// -------------------------------------------------------------
function renderAttendanceView() {
  const tbody = document.getElementById('attendance-table-body');
  if (!tbody || !window.appState) return;

  const records = window.appState.attendance;
  tbody.innerHTML = records.map(att => `
    <tr>
      <td><strong>${att.employeeId}</strong></td>
      <td>${att.name}</td>
      <td>${att.department}</td>
      <td>${att.date}</td>
      <td>${att.checkIn || '—'}</td>
      <td>${att.checkOut || 'Active'}</td>
      <td>${Math.round(att.durationSeconds / 3600 * 10) / 10} hrs</td>
      <td>${Math.round(att.breakSeconds / 60)} mins</td>
      <td>
        <span class="badge-tag ${att.isLate ? 'warning' : 'online'}">
          ${att.isLate ? 'LATE' : 'ON TIME'}
        </span>
      </td>
      <td>
        <span class="status-badge ${att.status === 'Present' ? 'status-badge-working' : 'status-badge-not-working'}">
          ${att.status}
        </span>
      </td>
    </tr>
  `).join('');

  // Self Check-in / Check-out button
  const checkInBtn = document.getElementById('self-checkin-btn');
  const checkOutBtn = document.getElementById('self-checkout-btn');
  
  if (checkInBtn) {
    checkInBtn.onclick = () => {
      window.appState.recordCheckIn(window.appState.currentUser.id || 'EMP-1001');
      renderAttendanceView();
      alert("Check-in time recorded successfully!");
    };
  }

  if (checkOutBtn) {
    checkOutBtn.onclick = () => {
      window.appState.recordCheckOut(window.appState.currentUser.id || 'EMP-1001');
      renderAttendanceView();
      alert("Check-out time recorded successfully!");
    };
  }
}

// -------------------------------------------------------------
// View 6: Smart Alert Center
// -------------------------------------------------------------
function renderAlertsView() {
  const container = document.getElementById('alerts-container');
  if (!container || !window.appState) return;

  const alerts = window.appState.alerts;
  const filterSeverity = document.getElementById('alert-severity-filter');
  const selected = filterSeverity ? filterSeverity.value : 'All';

  const filtered = selected === 'All' ? alerts : alerts.filter(a => a.severity === selected);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-text">No alerts matching filter "${selected}".</div>`;
    return;
  }

  container.innerHTML = filtered.map(a => `
    <div class="alert-card ${a.severity.toLowerCase()} ${a.status === 'Acknowledged' ? 'acked' : ''}">
      <div class="alert-card-header">
        <div class="alert-title-group">
          <span class="badge-tag ${a.severity.toLowerCase()}">${a.severity}</span>
          <span class="badge-tag">${a.type}</span>
          <strong>${a.employeeName} (${a.employeeId})</strong>
          <span class="alert-camera-tag">${a.camera}</span>
        </div>
        <span class="alert-time">${new Date(a.timestamp).toLocaleString()}</span>
      </div>
      <div class="alert-description">
        ${a.description}
      </div>
      <div class="alert-xai-box">
        <strong>Explainable AI Diagnosis:</strong> ${a.xaiSummary}
      </div>
      <div class="alert-footer">
        <div class="ack-status">
          ${a.status === 'Acknowledged' ? `
            <span class="text-success">✓ Acknowledged by ${a.acknowledgedBy} at ${new Date(a.acknowledgedAt).toLocaleTimeString()}</span>
          ` : `
            <span class="text-warning">● Pending Review</span>
          `}
        </div>
        <div class="alert-buttons">
          ${a.status === 'Unacknowledged' ? `
            <button class="btn btn-sm btn-primary" onclick="acknowledgeAlertItem('${a.id}')">Acknowledge</button>
          ` : ''}
          <button class="btn btn-sm btn-outline" onclick="dismissAlertItem('${a.id}')">Dismiss</button>
        </div>
      </div>
    </div>
  `).join('');
}

window.acknowledgeAlertItem = function(id) {
  window.appState.acknowledgeAlert(id);
  renderAlertsView();
  renderAlertsBadge();
};

window.dismissAlertItem = function(id) {
  window.appState.dismissAlert(id);
  renderAlertsView();
  renderAlertsBadge();
};

// -------------------------------------------------------------
// View 7: Activity Analytics
// -------------------------------------------------------------
function renderAnalyticsView() {
  const timelineContainer = document.getElementById('daily-timeline-blocks');
  if (timelineContainer && window.analyticsEngine) {
    const slots = window.analyticsEngine.generateTimelineBlocks();
    timelineContainer.innerHTML = slots.map(s => `
      <div class="timeline-slot ${s.type}" title="${s.time}: ${s.label}">
        <span class="slot-time">${s.time}</span>
      </div>
    `).join('');
  }

  // Weekly Trend Chart (Interactive SVG)
  const chartContainer = document.getElementById('weekly-chart-svg');
  if (chartContainer && window.analyticsEngine) {
    const data = window.analyticsEngine.weeklyTrend;
    const maxScore = 100;
    const svgWidth = 460;
    const svgHeight = 180;
    const barWidth = 48;
    const gap = (svgWidth - (barWidth * data.length)) / (data.length + 1);

    const bars = data.map((d, i) => {
      const h = (d.score / maxScore) * 120;
      const x = gap + i * (barWidth + gap);
      const y = 140 - h;
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="4" fill="var(--color-primary)" opacity="0.9"></rect>
        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" fill="var(--text-main)" font-size="12" font-weight="600">${d.score}%</text>
        <text x="${x + barWidth / 2}" y="160" text-anchor="middle" fill="var(--text-muted)" font-size="12">${d.day}</text>
      `;
    }).join('');

    chartContainer.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}">
        ${bars}
      </svg>
    `;
  }
}

// -------------------------------------------------------------
// View 8: Reports & Exports
// -------------------------------------------------------------
function renderReportsView() {
  const typeSelect = document.getElementById('report-type-select');
  const deptSelect = document.getElementById('report-dept-select');
  const previewTbody = document.getElementById('report-preview-body');
  const previewThead = document.getElementById('report-preview-head');

  function updatePreview() {
    if (!window.reportManager) return;
    const type = typeSelect ? typeSelect.value : 'employee';
    const dept = deptSelect ? deptSelect.value : 'All';
    const data = window.reportManager.generateReportData(type, dept, 'all');

    if (data.length === 0) {
      if (previewThead) previewThead.innerHTML = '';
      if (previewTbody) previewTbody.innerHTML = `<tr><td colspan="5">No report data found.</td></tr>`;
      return;
    }

    const headers = Object.keys(data[0]);
    if (previewThead) {
      previewThead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    }
    if (previewTbody) {
      previewTbody.innerHTML = data.map(row => `
        <tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>
      `).join('');
    }
  }

  if (typeSelect) typeSelect.onchange = updatePreview;
  if (deptSelect) deptSelect.onchange = updatePreview;

  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.onclick = () => {
      const type = typeSelect ? typeSelect.value : 'employee';
      const dept = deptSelect ? deptSelect.value : 'All';
      const data = window.reportManager.generateReportData(type, dept, 'all');
      window.reportManager.exportCSV(data, `worksense_report_${type}`);
    };
  }

  const exportPdfBtn = document.getElementById('export-pdf-btn');
  if (exportPdfBtn) {
    exportPdfBtn.onclick = () => {
      const type = typeSelect ? typeSelect.value : 'employee';
      const dept = deptSelect ? deptSelect.value : 'All';
      const data = window.reportManager.generateReportData(type, dept, 'all');
      window.reportManager.exportPDF(type, data);
    };
  }

  updatePreview();
}

// -------------------------------------------------------------
// View 9: Privacy & Audit Logs
// -------------------------------------------------------------
function renderPrivacyView() {
  const auditBody = document.getElementById('audit-log-body');
  if (auditBody && window.appState) {
    const logs = window.appState.auditLogs;
    auditBody.innerHTML = logs.map(l => `
      <tr>
        <td><strong>${l.id}</strong></td>
        <td>${new Date(l.timestamp).toLocaleString()}</td>
        <td>${l.user}</td>
        <td><span class="badge-tag">${l.role}</span></td>
        <td><strong>${l.action}</strong></td>
        <td>${l.details}</td>
      </tr>
    `).join('');
  }

  const downloadMyDataBtn = document.getElementById('download-my-data-btn');
  if (downloadMyDataBtn) {
    downloadMyDataBtn.onclick = () => {
      window.privacyManager.exportPersonalData(window.appState.currentUser.id || 'EMP-1001');
    };
  }
}

// -------------------------------------------------------------
// View 10: Settings
// -------------------------------------------------------------
function renderSettingsView() {
  if (!window.appState) return;
  const s = window.appState.settings;

  const inputEye = document.getElementById('cfg-eye-threshold');
  const inputAbsence = document.getElementById('cfg-absence-threshold');
  const inputTalk = document.getElementById('cfg-talk-threshold');
  const inputYawn = document.getElementById('cfg-yawn-threshold');
  const checkSound = document.getElementById('cfg-sound-alerts');
  const selectAlarmTheme = document.getElementById('cfg-alarm-sound');
  const checkEmail = document.getElementById('cfg-email-alerts');
  const inputEmail = document.getElementById('cfg-notification-email');
  const saveBtn = document.getElementById('save-settings-btn');

  if (inputEye) inputEye.value = s.eyeClosureThreshold;
  if (inputAbsence) inputAbsence.value = s.absenceThreshold;
  if (inputTalk) inputTalk.value = s.talkFrequencyThreshold;
  if (inputYawn) inputYawn.value = s.yawnThreshold;
  if (checkSound) checkSound.checked = s.soundAlerts;
  if (selectAlarmTheme) selectAlarmTheme.value = s.soundAlertTheme || 'voice';
  if (checkEmail) checkEmail.checked = s.emailNotifications;
  if (inputEmail) inputEmail.value = s.notificationEmail;

  if (saveBtn) {
    saveBtn.onclick = () => {
      window.appState.updateSettings({
        eyeClosureThreshold: parseFloat(inputEye.value) || 300,
        absenceThreshold: parseFloat(inputAbsence.value) || 120,
        talkFrequencyThreshold: parseInt(inputTalk.value) || 4,
        yawnThreshold: parseFloat(inputYawn.value) || 0.08,
        soundAlerts: checkSound.checked,
        soundAlertTheme: selectAlarmTheme ? selectAlarmTheme.value : 'voice',
        emailNotifications: checkEmail.checked,
        notificationEmail: inputEmail.value.trim()
      });
      const liveSelect = document.getElementById('select-alarm-sound');
      if (liveSelect && selectAlarmTheme) liveSelect.value = selectAlarmTheme.value;
      alert("Settings saved successfully and applied across all monitoring modules!");
    };
  }
}
