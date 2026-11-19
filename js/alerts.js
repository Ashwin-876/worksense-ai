// WorkSense AI - Smart Alert Center & Notification Dispatcher

class AlertManager {
  constructor() {
    this.audioCtx = null;
    this.absenceAlarmActive = false;
    this.alarmInterval = null;
    this.currentPlayingAudio = null;
    this.alarmAudioCache = {};
    this.alarmSounds = {
      'digital_beep': 'audio/alarm-digital.wav',
      'buzzer': 'audio/alarm-buzzer.wav',
      'siren': 'audio/alarm-siren.wav',
      'chime': 'audio/alarm-chime.wav'
    };
  }

  ensureAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!this.audioCtx) this.audioCtx = new AudioContext();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    return this.audioCtx;
  }

  getAudioForTheme(theme) {
    const src = this.alarmSounds[theme] || this.alarmSounds['digital_beep'];
    if (!this.alarmAudioCache[src]) {
      const a = new Audio(src);
      a.preload = 'auto';
      this.alarmAudioCache[src] = a;
    }
    return this.alarmAudioCache[src];
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
   * Play a single preview pulse of the selected alarm sound
   */
  playAlarmPulse(customTheme = null) {
    if (!window.appState || !window.appState.settings.soundAlerts) return;
    const theme = customTheme || (window.appState.settings && window.appState.settings.soundAlertTheme) || 'digital_beep';

    if (theme === 'voice') {
      this.playVoiceAlert();
      return;
    }

    try {
      const audio = this.getAudioForTheme(theme);
      audio.loop = false;
      audio.currentTime = 0;
      audio.play().catch(() => {
        this.playSynthesizedFallback(theme);
      });
    } catch (e) {
      this.playSynthesizedFallback(theme);
    }
  }

  playSynthesizedFallback(theme) {
    try {
      const ctx = this.ensureAudioContext();
      const now = ctx.currentTime;
      if (theme === 'chime') {
        this.synthesizeTone(ctx, 784, now, 0.32, 'sine', 0.22);
        this.synthesizeTone(ctx, 659.25, now + 0.16, 0.42, 'sine', 0.22);
      } else if (theme === 'buzzer') {
        this.synthesizeTone(ctx, 480, now, 0.28, 'triangle', 0.25);
        this.synthesizeTone(ctx, 480, now + 0.35, 0.28, 'triangle', 0.25);
      } else if (theme === 'siren') {
        this.synthesizeTone(ctx, 600, now, 0.22, 'triangle', 0.24);
        this.synthesizeTone(ctx, 900, now + 0.22, 0.25, 'triangle', 0.24);
      } else {
        // Digital 4-beep fallback
        for (let i = 0; i < 4; i++) {
          this.synthesizeTone(ctx, 2048, now + i * 0.12, 0.075, 'sine', 0.22);
        }
      }
    } catch (e) {
      console.warn("Synthesized fallback audio error:", e);
    }
  }

  synthesizeTone(ctx, freq, startTime, duration, type = 'sine', volume = 0.2) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  playVoiceAlert() {
    if (!('speechSynthesis' in window)) {
      this.playAlarmPulse('digital_beep');
      return;
    }
    if (window.speechSynthesis.speaking) return;
    const utterance = new SpeechSynthesisUtterance("Warning: No person detected at workstation.");
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  startAbsenceAlarm() {
    if (this.absenceAlarmActive) return;
    if (!window.appState || !window.appState.settings.soundAlerts) return;

    this.absenceAlarmActive = true;
    const theme = (window.appState.settings && window.appState.settings.soundAlertTheme) || 'digital_beep';

    if (theme === 'voice') {
      this.playVoiceAlert();
      this.alarmInterval = setInterval(() => {
        if (this.absenceAlarmActive && window.appState && window.appState.settings.soundAlerts) {
          this.playVoiceAlert();
        } else {
          this.stopAbsenceAlarm();
        }
      }, 2500);
      return;
    }

    try {
      const audio = this.getAudioForTheme(theme);
      audio.currentTime = 0;
      audio.loop = true;
      audio.play().then(() => {
        this.currentPlayingAudio = audio;
      }).catch(() => {
        this.startSynthesizedLoop(theme);
      });
    } catch (e) {
      this.startSynthesizedLoop(theme);
    }
  }

  startSynthesizedLoop(theme) {
    this.playSynthesizedFallback(theme);
    this.alarmInterval = setInterval(() => {
      if (this.absenceAlarmActive && window.appState && window.appState.settings.soundAlerts) {
        this.playSynthesizedFallback(theme);
      } else {
        this.stopAbsenceAlarm();
      }
    }, 1100);
  }

  stopAbsenceAlarm() {
    this.absenceAlarmActive = false;
    if (this.currentPlayingAudio) {
      try {
        this.currentPlayingAudio.pause();
        this.currentPlayingAudio.currentTime = 0;
        this.currentPlayingAudio.loop = false;
      } catch (e) {}
      this.currentPlayingAudio = null;
    }
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
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

