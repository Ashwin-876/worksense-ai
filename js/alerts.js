// WorkSense AI - Smart Alert Center & Notification Dispatcher

class AlertManager {
  constructor() {
    this.audioCtx = null;
  }

  playChime(type) {
    if (!window.appState || !window.appState.settings.soundAlerts) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'Critical' ? 660 : 440, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio chime could not play:", e);
    }
  }

  dispatchAlert(alertData) {
    if (!window.appState) return null;
    const alert = window.appState.addAlert(alertData);
    this.playChime(alert.severity);

    // If email notifications enabled, simulate outbound email delivery
    if (window.appState.settings.emailNotifications) {
      this.simulateEmailDispatch(alert);
    }
    return alert;
  }

  simulateEmailDispatch(alert) {
    const to = window.appState.settings.notificationEmail || 'manager@worksense.ai';
    console.info(`[WorkSense Alert Dispatcher] ✉️ Dispatched email to ${to}: [${alert.severity}] ${alert.type} - ${alert.employeeName}`);
  }

  getUnacknowledgedCount() {
    if (!window.appState) return 0;
    return window.appState.alerts.filter(a => a.status === 'Unacknowledged').length;
  }
}

window.alertManager = new AlertManager();

