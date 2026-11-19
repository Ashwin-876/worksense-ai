// WorkSense AI - Client-Side Computer Vision & Advanced AI Engine

class AIEngine {
  constructor() {
    this.LEFT_EYE = [33, 160, 158, 133, 153, 144];
    this.RIGHT_EYE = [362, 385, 387, 263, 373, 380];
    this.LIP_POINTS = [13, 14, 78, 308];
    
    this.EAR_THRESHOLD = 0.25;
    this.MAR_TALKING_THRESHOLD = 0.04;
    this.MAR_WINDOW_SIZE = 5;
    this.TALKING_TIMEOUT = 1.5;
    this.MONITORING_WINDOW = 60; // 1 min

    // Yawn detection state
    this.yawnStartTime = null;
    this.isYawning = false;
    this.yawnCount = 0;
    this.recentYawns = [];

    // State tracking
    this.present = false;
    this.lastPresenceTime = Date.now() / 1000;
    this.sessionStartTime = null;
    this.eyeClosureStart = 0;
    this.continuousEyeClosed = false;
    this.talkingStateChanges = [];
    this.lastStatus = null;
    this.lastLogTime = 0;
    this.lastTalkingTime = 0;
    this.isTalking = false;
    this.prevIsTalking = false;
    this.lipDistances = [];

    // MediaPipe components
    this.faceMesh = null;
    this.camera = null;
    this.isRunning = false;
    this.onTelemetryUpdate = null;
    this.onAlertTriggered = null;
    this.onStatusChanged = null;
  }

  calculateEAR(eyeIndices, landmarks, w, h) {
    const pts = eyeIndices.map(i => ({ x: landmarks[i].x * w, y: landmarks[i].y * h }));
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const v1 = dist(pts[1], pts[5]);
    const v2 = dist(pts[2], pts[4]);
    const horiz = dist(pts[0], pts[3]);
    return (v1 + v2) / (2.0 * horiz);
  }

  calculateMAR(lipIndices, landmarks, w, h) {
    const top = { x: landmarks[lipIndices[0]].x * w, y: landmarks[lipIndices[0]].y * h };
    const bottom = { x: landmarks[lipIndices[1]].x * w, y: landmarks[lipIndices[1]].y * h };
    const left = { x: landmarks[lipIndices[2]].x * w, y: landmarks[lipIndices[2]].y * h };
    const right = { x: landmarks[lipIndices[3]].x * w, y: landmarks[lipIndices[3]].y * h };
    const v = Math.hypot(top.x - bottom.x, top.y - bottom.y);
    const hDist = Math.hypot(left.x - right.x, left.y - right.y);
    return v / hDist;
  }

  estimateHeadPose(landmarks, w, h) {
    if (!landmarks || landmarks.length < 478) return { pitch: 0, yaw: 0, roll: 0 };
    const nose = landmarks[1];
    const chin = landmarks[152];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const forehead = landmarks[10];

    // Roll (tilt left/right)
    const dx = (rightEye.x - leftEye.x) * w;
    const dy = (rightEye.y - leftEye.y) * h;
    const roll = Math.atan2(dy, dx) * (180 / Math.PI);

    // Yaw (look left/right)
    const eyeMidX = (leftEye.x + rightEye.x) / 2.0;
    const eyeDist = Math.max(Math.abs(rightEye.x - leftEye.x), 1e-4);
    const yaw = ((nose.x - eyeMidX) / (eyeDist / 2.0)) * 45.0;

    // Pitch (look up/down)
    const faceHeight = Math.max(Math.abs(chin.y - forehead.y), 1e-4);
    const midEyeY = (leftEye.y + rightEye.y) / 2.0;
    const noseRelY = (nose.y - midEyeY) / faceHeight;
    const pitch = (noseRelY - 0.35) * 80.0;

    return {
      pitch: Math.round(pitch),
      yaw: Math.round(yaw),
      roll: Math.round(roll)
    };
  }

  detectYawn(mar, currentTime, threshold, minDuration) {
    const isWide = mar > (threshold || 0.08);
    let registered = false;

    if (isWide) {
      if (this.yawnStartTime === null) {
        this.yawnStartTime = currentTime;
      } else if ((currentTime - this.yawnStartTime) >= (minDuration || 1.8) && !this.isYawning) {
        this.isYawning = true;
        this.yawnCount++;
        this.recentYawns.push(currentTime);
        registered = true;
      }
    } else {
      this.yawnStartTime = null;
      this.isYawning = false;
    }

    this.recentYawns = this.recentYawns.filter(t => currentTime - t <= 300);
    return {
      isYawning: this.isYawning,
      yawnCount: this.yawnCount,
      newYawnEvent: registered
    };
  }

  analyzePosture(pitch, yaw, roll) {
    if (Math.abs(yaw) > 28) {
      return { status: 'Looking Away', description: `Head turned ${Math.abs(yaw)}° away from monitor.` };
    }
    if (pitch < -20) {
      return { status: 'Slouching / Looking Down', description: `Downward pitch of ${Math.abs(pitch)}° indicates fatigue or mobile screen usage.` };
    }
    if (Math.abs(roll) > 22) {
      return { status: 'Head Tilted', description: `Head tilt angle of ${Math.abs(roll)}° from vertical.` };
    }
    return { status: 'Good Posture', description: 'Workstation ergonomic alignment is optimal.' };
  }

  generateXAISummary(params) {
    const reasons = [];
    if (params.eyeIssue) {
      reasons.push(`Eyes closed for ${Math.round(params.eyeClosureDuration)}s (exceeded ${params.eyeClosureThreshold}s threshold)`);
    }
    if (params.absenceIssue) {
      reasons.push(`Workstation absence for ${Math.round(params.absenceDuration)}s (exceeded ${params.absenceThreshold}s threshold)`);
    }
    if (params.talkingIssue) {
      reasons.push(`Continuous speech: ${params.talkingFrequency} talk events/min (limit: ${params.talkFrequencyThreshold})`);
    }
    if (params.isYawning) {
      reasons.push(`Active yawning event detected (Fatigue count: ${params.yawnCount})`);
    }
    if (params.posture.status !== 'Good Posture') {
      reasons.push(params.posture.description);
    }

    if (reasons.length === 0) {
      return 'Employee is attentive, upright, and actively engaged in work.';
    }
    return `Evaluated as "${params.workingStatus}": ${reasons.join(' • ')}.`;
  }

  initFaceMesh() {
    this.faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults((results) => this.processResults(results));
  }

  processResults(results) {
    if (!this.isRunning) return;

    const currentTime = Date.now() / 1000;
    const canvas = document.getElementById('output-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Draw video frame
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(results.image, 0, 0, w, h);

    const settings = window.appState ? window.appState.settings : {};
    const eyeClosureThreshold = settings.eyeClosureThreshold || 300;
    const absenceThreshold = settings.absenceThreshold || 120;
    const talkFrequencyThreshold = settings.talkFrequencyThreshold || 4;
    const yawnThreshold = settings.yawnThreshold || 0.08;
    const yawnMinDuration = settings.yawnMinDuration || 1.8;

    const hasFace = Boolean(results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0);
    let eyeStatus = "Unknown";
    let avgEar = 0;
    let mouthStatus = "Not Talking";
    let mar = 0;
    let stateChange = false;
    let headPose = { pitch: 0, yaw: 0, roll: 0 };
    let posture = { status: 'Unknown', description: 'No face detected.' };
    let yawnResult = { isYawning: false, yawnCount: this.yawnCount, newYawnEvent: false };

    if (hasFace) {
      const landmarks = results.multiFaceLandmarks[0];

      if (!this.present) {
        this.present = true;
        this.sessionStartTime = currentTime;
      }
      this.lastPresenceTime = currentTime;

      // EAR
      const leftEar = this.calculateEAR(this.LEFT_EYE, landmarks, w, h);
      const rightEar = this.calculateEAR(this.RIGHT_EYE, landmarks, w, h);
      avgEar = (leftEar + rightEar) / 2.0;
      eyeStatus = avgEar < this.EAR_THRESHOLD ? "Eyes Closed" : "Eyes Open";

      // MAR
      mar = this.calculateMAR(this.LIP_POINTS, landmarks, w, h);
      this.lipDistances.push(mar);
      if (this.lipDistances.length > this.MAR_WINDOW_SIZE) this.lipDistances.shift();

      if (this.lipDistances.length === this.MAR_WINDOW_SIZE) {
        const mean = this.lipDistances.reduce((a, b) => a + b, 0) / this.lipDistances.length;
        const stdDev = Math.sqrt(this.lipDistances.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.lipDistances.length);
        if (stdDev > this.MAR_TALKING_THRESHOLD) {
          this.lastTalkingTime = currentTime;
          if (!this.isTalking) stateChange = true;
          this.isTalking = true;
        } else if (currentTime - this.lastTalkingTime > this.TALKING_TIMEOUT) {
          this.isTalking = false;
        }
        if (!this.prevIsTalking && this.isTalking) stateChange = true;
        this.prevIsTalking = this.isTalking;
      }
      mouthStatus = this.isTalking ? "Talking" : "Not Talking";

      // Head Pose & Posture
      headPose = this.estimateHeadPose(landmarks, w, h);
      posture = this.analyzePosture(headPose.pitch, headPose.yaw, headPose.roll);

      // Yawning
      yawnResult = this.detectYawn(mar, currentTime, yawnThreshold, yawnMinDuration);
      if (yawnResult.newYawnEvent && this.onAlertTriggered) {
        this.onAlertTriggered({
          type: 'DROWSINESS',
          severity: 'Warning',
          description: `Yawn detected (#${yawnResult.yawnCount}) while on active shift.`,
          xaiSummary: `MAR peaked at ${mar.toFixed(3)} exceeding threshold for ${yawnMinDuration}s.`
        });
      }

      // Draw annotations if enabled
      if (settings.drawFaceMesh !== false) {
        this.drawAnnotations(ctx, landmarks, w, h, headPose);
      }
    } else {
      this.present = false;
    }

    if (stateChange) this.talkingStateChanges.push(currentTime);
    this.talkingStateChanges = this.talkingStateChanges.filter(t => currentTime - t <= this.MONITORING_WINDOW);
    const talkingFrequency = this.talkingStateChanges.length;

    // Eye closure timer
    let eyeClosureDuration = 0;
    if (eyeStatus === "Eyes Closed") {
      if (!this.continuousEyeClosed) {
        this.eyeClosureStart = currentTime;
        this.continuousEyeClosed = true;
      }
      eyeClosureDuration = currentTime - this.eyeClosureStart;
    } else {
      this.continuousEyeClosed = false;
    }

    // Absence timer
    const absenceDuration = !this.present ? (currentTime - this.lastPresenceTime) : 0;

    // Working status
    const eyeIssue = eyeClosureDuration > eyeClosureThreshold;
    const talkingIssue = talkingFrequency > talkFrequencyThreshold;
    const absenceIssue = !this.present && (currentTime - this.lastPresenceTime > absenceThreshold);
    const workingStatus = (eyeIssue || talkingIssue || absenceIssue) ? "Not Working" : "Working";

    // XAI Summary
    const xaiSummary = this.generateXAISummary({
      workingStatus,
      eyeIssue,
      eyeClosureDuration,
      eyeClosureThreshold,
      absenceIssue,
      absenceDuration,
      absenceThreshold,
      talkingIssue,
      talkingFrequency,
      talkFrequencyThreshold,
      isYawning: yawnResult.isYawning,
      yawnCount: yawnResult.yawnCount,
      posture
    });

    // Fire status change
    if (workingStatus !== this.lastStatus && (currentTime - this.lastLogTime > 5)) {
      if (this.sessionStartTime && this.onStatusChanged) {
        const duration = Math.round(currentTime - this.sessionStartTime);
        this.onStatusChanged({
          startTime: this.sessionStartTime,
          endTime: currentTime,
          duration,
          status: workingStatus,
          xaiSummary
        });
        this.lastLogTime = currentTime;
      }
      this.lastStatus = workingStatus;
      this.sessionStartTime = currentTime;

      // Trigger automatic smart alert if transitioned to "Not Working"
      if (workingStatus === "Not Working" && this.onAlertTriggered) {
        const alertType = eyeIssue ? 'DROWSINESS' : (absenceIssue ? 'ABSENCE' : 'INACTIVITY');
        this.onAlertTriggered({
          type: alertType,
          severity: 'Warning',
          description: `Employee status changed to "${workingStatus}".`,
          xaiSummary
        });
      }
    }

    ctx.restore();

    // Send complete telemetry payload to UI
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        present: this.present,
        absenceDuration,
        absenceThreshold,
        eyeStatus,
        ear: avgEar,
        eyeClosureDuration,
        eyeClosureThreshold,
        continuousEyeClosed: this.continuousEyeClosed,
        mouthStatus,
        mar,
        isYawning: yawnResult.isYawning,
        yawnCount: yawnResult.yawnCount,
        headPose,
        posture,
        talkingFrequency,
        talkFrequencyThreshold,
        workingStatus,
        xaiSummary,
        currentTime,
        sessionStartTime: this.sessionStartTime
      });
    }
  }

  drawAnnotations(ctx, landmarks, w, h, headPose) {
    if (window.drawConnectors && window.FACEMESH_TESSELATION) {
      window.drawConnectors(ctx, landmarks, window.FACEMESH_TESSELATION, {
        color: '#4080FF40',
        lineWidth: 1
      });
    }

    const drawBox = (indices, strokeStyle) => {
      const pts = indices.map(i => ({ x: landmarks[i].x * w, y: landmarks[i].y * h }));
      if (pts.length > 0) {
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.strokeRect(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      }
    };

    drawBox(this.LEFT_EYE, '#FFFF00');
    drawBox(this.RIGHT_EYE, '#FFFF00');
    drawBox(this.LIP_POINTS, '#FF00FF');
  }

  async start(videoElement, deviceId) {
    if (!this.faceMesh) this.initFaceMesh();
    
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { width: 640, height: 480 }
    };

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.isRunning && videoElement.readyState >= 2) {
          const canvas = document.getElementById('output-canvas');
          if (canvas) {
            canvas.width = videoElement.videoWidth || 640;
            canvas.height = videoElement.videoHeight || 480;
          }
          await this.faceMesh.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480
    });

    await this.camera.start();
    this.isRunning = true;
    this.lastPresenceTime = Date.now() / 1000;
  }

  stop() {
    this.isRunning = false;
    if (this.camera) this.camera.stop();
    if (window.alertManager) {
      window.alertManager.stopAbsenceAlarm();
    }
  }
}

window.aiEngine = new AIEngine();

