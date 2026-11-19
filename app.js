// WorkSense AI – Employee Monitoring System

// Constants matching main.py
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const LIP_POINTS = [13, 14, 78, 308];
const EAR_THRESHOLD = 0.25;
const MAR_THRESHOLD = 0.04;
const MAR_WINDOW_SIZE = 5;
const TALKING_TIMEOUT = 1.5; // seconds
const MONITORING_WINDOW = 60; // 1 minute

// State Tracking
let isMonitoring = false;
let camera = null;
let faceMesh = null;
let lastPresenceTime = Date.now() / 1000;
let present = false;
let sessionStartTime = null;
let eyeClosureStart = 0;
let continuousEyeClosed = false;
let talkingStateChanges = [];
let lastStatus = null;
let lastLogTime = 0;
let lastTalkingTime = 0;
let isTalking = false;
let prevIsTalking = false;
let lipDistances = [];
let sessionLogs = [];

// Frame Rate Tracking
let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 0;

// DOM Elements
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const placeholderOverlay = document.getElementById('camera-placeholder');
const hudOverlay = document.getElementById('hud-overlay');
const themeToggleBtn = document.getElementById('theme-toggle');
const downloadCsvBtn = document.getElementById('download-csv-btn');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const systemStatusPill = document.getElementById('system-status-pill');

// HUD Elements
const hudPresence = document.getElementById('hud-presence');
const hudEye = document.getElementById('hud-eye');
const hudMouth = document.getElementById('hud-mouth');
const hudTalkEvents = document.getElementById('hud-talk-events');
const hudStatus = document.getElementById('hud-status');
const hudEyeTimer = document.getElementById('hud-eye-timer');
const hudAbsenceTimer = document.getElementById('hud-absence-timer');

// Metric Elements
const metricPresence = document.getElementById('metric-presence');
const metricAbsenceTime = document.getElementById('metric-absence-time');
const metricEye = document.getElementById('metric-eye');
const metricEar = document.getElementById('metric-ear');
const metricMouth = document.getElementById('metric-mouth');
const metricMar = document.getElementById('metric-mar');
const metricTalkEvents = document.getElementById('metric-talk-events');
const metricWorkingStatus = document.getElementById('metric-working-status');
const metricSessionDuration = document.getElementById('metric-session-duration');
const fpsCounter = document.getElementById('fps-counter');
const sessionLogBody = document.getElementById('session-log-body');

// Input Thresholds
const inputEyeThresh = document.getElementById('input-eye-thresh');
const inputAbsenceThresh = document.getElementById('input-absence-thresh');
const inputTalkThresh = document.getElementById('input-talk-thresh');
const checkDrawMesh = document.getElementById('check-draw-mesh');

// Helper math functions matching metric_utils.py
function calculateEAR(eyeIndices, landmarks, w, h) {
  const points = eyeIndices.map(i => ({ x: landmarks[i].x * w, y: landmarks[i].y * h }));
  const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const vertical1 = dist(points[1], points[5]);
  const vertical2 = dist(points[2], points[4]);
  const horizontal = dist(points[0], points[3]);
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

function calculateMAR(lipIndices, landmarks, w, h) {
  const top = { x: landmarks[lipIndices[0]].x * w, y: landmarks[lipIndices[0]].y * h };
  const bottom = { x: landmarks[lipIndices[1]].x * w, y: landmarks[lipIndices[1]].y * h };
  const left = { x: landmarks[lipIndices[2]].x * w, y: landmarks[lipIndices[2]].y * h };
  const right = { x: landmarks[lipIndices[3]].x * w, y: landmarks[lipIndices[3]].y * h };
  const vertical = Math.hypot(top.x - bottom.x, top.y - bottom.y);
  const horizontal = Math.hypot(left.x - right.x, left.y - right.y);
  return vertical / horizontal;
}

function calculateStdDev(arr) {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function formatTime(timestampSec) {
  const d = new Date(timestampSec * 1000);
  return d.toTimeString().split(' ')[0];
}

function formatDate(timestampSec) {
  const d = new Date(timestampSec * 1000);
  return d.toISOString().split('T')[0];
}

// MediaPipe FaceMesh Initialization
function initFaceMesh() {
  faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults(onResults);
}

// Frame Processing Callback
function onResults(results) {
  if (!isMonitoring) return;

  const currentTime = Date.now() / 1000;
  const w = canvasElement.width;
  const h = canvasElement.height;

  // Track FPS
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
    fpsCounter.textContent = `${currentFps} FPS`;
    frameCount = 0;
    lastFpsTime = now;
  }

  // Draw incoming video frame onto canvas
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, w, h);
  canvasCtx.drawImage(results.image, 0, 0, w, h);

  const eyeClosureThreshold = parseFloat(inputEyeThresh.value) || 300;
  const absenceThreshold = parseFloat(inputAbsenceThresh.value) || 120;
  const talkFrequencyThreshold = parseInt(inputTalkThresh.value) || 4;

  const hasFace = Boolean(results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0);
  let eyeStatus = "Unknown";
  let avgEar = 0;
  let mouthStatus = "Not Talking";
  let mar = 0;
  let stateChange = false;

  if (hasFace) {
    const landmarks = results.multiFaceLandmarks[0];

    // Presence detection
    if (!present) {
      present = true;
      sessionStartTime = currentTime;
    }
    lastPresenceTime = currentTime;

    // Eye Tracking (EAR)
    const leftEar = calculateEAR(LEFT_EYE, landmarks, w, h);
    const rightEar = calculateEAR(RIGHT_EYE, landmarks, w, h);
    avgEar = (leftEar + rightEar) / 2.0;
    eyeStatus = avgEar < EAR_THRESHOLD ? "Eyes Closed" : "Eyes Open";

    // Mouth / Talking Tracking (MAR)
    mar = calculateMAR(LIP_POINTS, landmarks, w, h);
    lipDistances.push(mar);
    if (lipDistances.length > MAR_WINDOW_SIZE) {
      lipDistances.shift();
    }

    if (lipDistances.length === MAR_WINDOW_SIZE) {
      const stdDev = calculateStdDev(lipDistances);
      if (stdDev > MAR_THRESHOLD) {
        lastTalkingTime = currentTime;
        if (!isTalking) {
          stateChange = true;
        }
        isTalking = true;
      } else if (currentTime - lastTalkingTime > TALKING_TIMEOUT) {
        isTalking = false;
      }

      if (!prevIsTalking && isTalking) {
        stateChange = true;
      }
      prevIsTalking = isTalking;
    }
    mouthStatus = isTalking ? "Talking" : "Not Talking";

    // Draw Face Annotations
    if (checkDrawMesh.checked) {
      drawFaceAnnotations(canvasCtx, landmarks, w, h);
    }
  } else {
    present = false;
  }

  // Record Talking state change
  if (stateChange) {
    talkingStateChanges.push(currentTime);
  }
  talkingStateChanges = talkingStateChanges.filter(t => currentTime - t <= MONITORING_WINDOW);
  const talkingFrequency = talkingStateChanges.length;

  // Eye Closure Tracking
  let eyeClosureDuration = 0;
  if (eyeStatus === "Eyes Closed") {
    if (!continuousEyeClosed) {
      eyeClosureStart = currentTime;
      continuousEyeClosed = true;
    }
    eyeClosureDuration = currentTime - eyeClosureStart;
  } else {
    continuousEyeClosed = false;
  }

  // Absence Duration
  const absenceDuration = !present ? (currentTime - lastPresenceTime) : 0;

  // Working Status Evaluation
  const eyeIssue = eyeClosureDuration > eyeClosureThreshold;
  const talkingIssue = talkingFrequency > talkFrequencyThreshold;
  const absenceIssue = !present && (currentTime - lastPresenceTime > absenceThreshold);
  const workingStatus = (eyeIssue || talkingIssue || absenceIssue) ? "Not Working" : "Working";

  // Log on status change (with 5-second debounce)
  if (workingStatus !== lastStatus && (currentTime - lastLogTime > 5)) {
    if (sessionStartTime) {
      const duration = Math.round(currentTime - sessionStartTime);
      logSession(sessionStartTime, currentTime, duration, workingStatus);
      lastLogTime = currentTime;
    }
    lastStatus = workingStatus;
    sessionStartTime = currentTime;
  }

  canvasCtx.restore();

  // Update UI Elements
  updateHUDAndMetrics({
    present,
    absenceDuration,
    absenceThreshold,
    eyeStatus,
    avgEar,
    eyeClosureDuration,
    eyeClosureThreshold,
    continuousEyeClosed,
    mouthStatus,
    mar,
    talkingFrequency,
    talkFrequencyThreshold,
    workingStatus,
    sessionStartTime,
    currentTime
  });
}

// Drawing Utilities
function drawFaceAnnotations(ctx, landmarks, w, h) {
  // Draw FaceMesh Tesselation
  if (window.drawConnectors && window.FACEMESH_TESSELATION) {
    window.drawConnectors(ctx, landmarks, window.FACEMESH_TESSELATION, {
      color: '#C0C0C070',
      lineWidth: 1
    });
  }

  // Draw Eye and Lip bounding boxes
  function drawBox(indices, strokeStyle) {
    const pts = indices.map(i => ({ x: landmarks[i].x * w, y: landmarks[i].y * h }));
    if (pts.length > 0) {
      const xs = pts.map(p => p.x);
      const ys = pts.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 2;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }
  }

  drawBox(LEFT_EYE, '#FFFF00');  // Left Eye (Yellow)
  drawBox(RIGHT_EYE, '#FFFF00'); // Right Eye (Yellow)
  drawBox(LIP_POINTS, '#FF00FF'); // Lips (Magenta)
}

// Update HUD & Metrics UI
function updateHUDAndMetrics(data) {
  // HUD
  hudPresence.textContent = `Presence: ${data.present ? "Present" : "Absent"}`;
  hudPresence.style.color = data.present ? "#00ff00" : "#ff4444";

  hudEye.textContent = `Eye: ${data.eyeStatus}`;
  hudMouth.textContent = `Mouth: ${data.mouthStatus}`;
  hudTalkEvents.textContent = `Talk Events: ${data.talkingFrequency}/${data.talkFrequencyThreshold}`;
  hudStatus.textContent = `Status: ${data.workingStatus}`;
  hudStatus.style.color = data.workingStatus === "Working" ? "#00ffff" : "#ff4444";

  if (data.continuousEyeClosed) {
    hudEyeTimer.classList.remove('hidden');
    hudEyeTimer.textContent = `Eyes Closed: ${Math.round(data.eyeClosureDuration)}s / ${data.eyeClosureThreshold}s`;
  } else {
    hudEyeTimer.classList.add('hidden');
  }

  if (!data.present) {
    hudAbsenceTimer.classList.remove('hidden');
    hudAbsenceTimer.textContent = `Absent: ${Math.round(data.absenceDuration)}s / ${data.absenceThreshold}s`;
  } else {
    hudAbsenceTimer.classList.add('hidden');
  }

  // Metrics Cards
  metricPresence.textContent = data.present ? "Present" : "Absent";
  metricPresence.className = `metric-value ${data.present ? "badge-present" : "badge-absent"}`;
  metricAbsenceTime.textContent = !data.present ? `Absence timer: ${Math.round(data.absenceDuration)}s` : "Actively present";

  metricEye.textContent = data.eyeStatus;
  metricEar.textContent = `EAR: ${data.avgEar.toFixed(2)}`;

  metricMouth.textContent = data.mouthStatus;
  metricMar.textContent = `MAR: ${data.mar.toFixed(3)}`;

  metricTalkEvents.textContent = `${data.talkingFrequency} / ${data.talkFrequencyThreshold}`;

  metricWorkingStatus.textContent = data.workingStatus;
  metricWorkingStatus.className = `metric-value ${data.workingStatus === "Working" ? "badge-working" : "badge-not-working"}`;

  const currentDuration = data.sessionStartTime ? Math.round(data.currentTime - data.sessionStartTime) : 0;
  metricSessionDuration.textContent = `Current status duration: ${currentDuration}s`;
}

// Session Logging
function logSession(startSec, endSec, duration, status) {
  const logItem = {
    date: formatDate(startSec),
    startTime: formatTime(startSec),
    endTime: formatTime(endSec),
    duration: duration,
    status: status
  };

  sessionLogs.unshift(logItem); // Add to beginning
  renderSessionLogs();
}

function renderSessionLogs() {
  if (sessionLogs.length === 0) {
    sessionLogBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">No sessions logged yet. Start monitoring to begin recording activity transitions.</td>
      </tr>
    `;
    return;
  }

  sessionLogBody.innerHTML = sessionLogs.map(log => `
    <tr>
      <td>${log.date}</td>
      <td>${log.startTime}</td>
      <td>${log.endTime}</td>
      <td>${log.duration}</td>
      <td>
        <span class="status-badge ${log.status.trim() === "Working" ? "status-badge-working" : "status-badge-not-working"}">
          ${log.status}
        </span>
      </td>
    </tr>
  `).join('');
}

// Download CSV
function downloadCSV() {
  if (sessionLogs.length === 0) {
    alert("No session logs recorded yet to export.");
    return;
  }

  const headers = ['Date', 'Start Time', 'End Time', 'Duration (seconds)', 'Status'];
  const rows = sessionLogs.map(log => [
    log.date,
    log.startTime,
    log.endTime,
    log.duration,
    `"${log.status}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `presence_log_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Start Monitoring
async function startMonitoring() {
  try {
    startBtn.disabled = true;
    startBtn.textContent = "Starting...";

    if (!faceMesh) {
      initFaceMesh();
    }

    camera = new Camera(videoElement, {
      onFrame: async () => {
        if (isMonitoring && videoElement.readyState >= 2) {
          canvasElement.width = videoElement.videoWidth || 640;
          canvasElement.height = videoElement.videoHeight || 480;
          await faceMesh.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480
    });

    await camera.start();
    isMonitoring = true;
    startBtn.textContent = "▶ Start Monitoring";
    startBtn.disabled = true;
    stopBtn.disabled = false;
    placeholderOverlay.classList.add('hidden');
    hudOverlay.classList.remove('hidden');

    systemStatusPill.textContent = "Monitoring Live";
    systemStatusPill.className = "status-pill status-live";
    lastPresenceTime = Date.now() / 1000;
  } catch (err) {
    console.error("Camera access error:", err);
    alert(`Could not start camera: ${err.message}. Please check browser webcam permissions.`);
    startBtn.disabled = false;
    startBtn.textContent = "▶ Start Monitoring";
  }
}

// Stop Monitoring
function stopMonitoring() {
  if (camera) {
    camera.stop();
  }
  isMonitoring = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  placeholderOverlay.classList.remove('hidden');
  hudOverlay.classList.add('hidden');
  systemStatusPill.textContent = "System Ready";
  systemStatusPill.className = "status-pill status-ready";
  fpsCounter.textContent = "0 FPS";

  // Final log if session active
  const currentTime = Date.now() / 1000;
  if (sessionStartTime && lastStatus) {
    const duration = Math.round(currentTime - sessionStartTime);
    logSession(sessionStartTime, currentTime, duration, lastStatus);
    sessionStartTime = null;
  }
}

// Theme Toggle
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// Event Listeners
startBtn.addEventListener('click', startMonitoring);
stopBtn.addEventListener('click', stopMonitoring);
themeToggleBtn.addEventListener('click', toggleTheme);
downloadCsvBtn.addEventListener('click', downloadCSV);
clearLogsBtn.addEventListener('click', () => {
  sessionLogs = [];
  renderSessionLogs();
});

// Restore Theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

