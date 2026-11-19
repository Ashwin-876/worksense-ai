// WorkSense AI - Smart Alert Center & Notification Dispatcher

class AlertManager {
  constructor() {
    this.audioCtx = null;
    this.absenceAlarmActive = false;
    this.alarmInterval = null;
  }

  ensureAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!this.audioCtx) this.audioCtx = new AudioContext();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    return this.audioCtx;
  }

  playChime(type) {
    if (!window.appState || !window.appState.settings.soundAlerts) return;
    try {
      const ctx = this.ensureAudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'Critical' ? 660 : 440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio chime could not play:", e);
    }
  }

  /**
   * Synthesizes an audible security alarm sound when no person is detected.
   * Emits urgent alternating dual-tone siren pulses (sawtooth wave: 960Hz / 800Hz / 1100Hz).
   */
  playAlarmPulse() {
    if (!window.appState || !window.appState.settings.soundAlerts) return;
    try {
      const ctx = this.ensureAudioContext();
      const now = ctx.currentTime;

      // Tone 1: Piercing siren beep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(960, now);
      osc1.frequency.exponentialRampToValueAtTime(780, now + 0.16);
      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.17);

      // Tone 2: Second higher alarm pulse
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1100, now + 0.20);
      osc2.frequency.exponentialRampToValueAtTime(860, now + 0.38);
      gain2.gain.setValueAtTime(0.26, now + 0.20);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.20);
      osc2.stop(now + 0.39);
    } catch (e) {
      console.warn("Alarm pulse audio error:", e);
    }
  }

  startAbsenceAlarm() {
    if (this.absenceAlarmActive) return;
    if (!window.appState || !window.appState.settings.soundAlerts) return;

    this.absenceAlarmActive = true;
    this.playAlarmPulse();

    // Pulse alarm sound repeatedly every 1.1s while no person is present
    this.alarmInterval = setInterval(() => {
      if (this.absenceAlarmActive && window.appState && window.appState.settings.soundAlerts) {
        this.playAlarmPulse();
      } else {
        this.stopAbsenceAlarm();
      }
    }, 1100);
  }

  stopAbsenceAlarm() {
    this.absenceAlarmActive = false;
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
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

