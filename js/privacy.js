// WorkSense AI - Privacy, Security & Compliance Module

class PrivacyManager {
  constructor() {
    this.consentAccepted = localStorage.getItem('worksense_consent_accepted') === 'true';
  }

  hasAcceptedConsent() {
    return this.consentAccepted;
  }

  recordConsent(employeeName = 'Current User') {
    this.consentAccepted = true;
    localStorage.setItem('worksense_consent_accepted', 'true');
    if (window.appState) {
      window.appState.addAuditLog('CONSENT_ACCEPTED', `Employee monitoring transparency notice acknowledged and signed by ${employeeName}`);
    }
  }

  togglePrivacyBlur(enable) {
    if (window.appState) {
      window.appState.updateSettings({ privacyBlurMode: enable });
      const canvas = document.getElementById('output-canvas');
      if (canvas) {
        if (enable) {
          canvas.classList.add('privacy-blur');
        } else {
          canvas.classList.remove('privacy-blur');
        }
      }
    }
  }

  exportPersonalData(employeeId) {
    const employees = window.appState ? window.appState.employees : [];
    const attendance = window.appState ? window.appState.attendance : [];
    const alerts = window.appState ? window.appState.alerts : [];

    const emp = employees.find(e => e.id === employeeId) || employees[0];
    const myAttendance = attendance.filter(a => a.employeeId === emp.id);
    const myAlerts = alerts.filter(a => a.employeeId === emp.id);

    const data = {
      employeeProfile: emp,
      attendanceHistory: myAttendance,
      telemetryAlerts: myAlerts,
      privacyStatement: "Under WorkSense AI policy, video streams are processed ephemerally on-device and never stored as raw recordings. Only anonymous mathematical landmarks (EAR, MAR, Head-Pose) and state transitions are recorded.",
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my_monitoring_data_${emp.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

window.privacyManager = new PrivacyManager();

