# WorkSense AI – Employee Monitoring System

**WorkSense AI**\
*AI-Powered Employee Monitoring System*

WorkSense AI is an enterprise-grade, privacy-first **AI-Powered Employee Monitoring System** built with **OpenCV**, **MediaPipe FaceMesh**, and a modern web dashboard. It continuously evaluates workstation presence, attention, drowsiness, posture, and activity while respecting employee privacy through client-side edge computing.

---

### 🌟 Platform Architecture & Modules

#### 1. 👥 Employee Management
* Unique Employee IDs (e.g. `EMP-1001`) with profile cards, departments, designations, and workstation assignments.
* Individual employee monitoring history and incident tracking.
* Role-based permissions to create, edit, and manage employee records.

#### 2. 📹 Multi-Camera Monitoring
* Hardware camera enumeration (`navigator.mediaDevices.enumerateDevices()`) and multi-feed management.
* Live camera grid supporting 1x1, 2x2, and 3x3 layouts.
* Camera health indicators (Online, Standby, Error) and employee-to-camera assignments.

#### 3. 🔔 Smart Alert Center
* Real-time automated triggers:
  * **Absence Alerts**: When workstation is unattended beyond threshold.
  * **Inactivity & Drowsiness Alerts**: Prolonged eye closure or frequent yawning.
  * **Ergonomic Posture Alerts**: Excessive slouching, downward pitch, or head tilt.
  * **Camera Disconnection Alerts**: Instant notification when video feeds disconnect.
* Severity levels (`Critical`, `Warning`, `Info`) with supervisor acknowledgement workflows.
* Non-blocking synthesized audio chimes and automated email dispatch simulator.

#### 4. ⏱️ Attendance & Timecard Management
* One-click self-service Check-In and Check-Out (with automatic presence synchronization).
* Shift duration tracking, break duration monitoring, and late arrival flags.
* Daily attendance registers and exportable timecards.

#### 5. 📈 Activity Analytics
* Real-time breakdown of **Active Time**, **Inactive Time**, and **Away Time**.
* **Daily Activity Timeline**: 30-minute segmented visual status bar from 09:00 to 17:00.
* **Weekly Productivity Trend**: Dynamic SVG chart tracking daily engagement scores.
* **Department Breakdown**: Comparative productivity indices across departments.

#### 6. 🧠 Advanced Computer Vision & Explainable AI (XAI)
* **Eye Aspect Ratio (EAR)**: Precise eye closure and micro-sleep detection.
* **Mouth Aspect Ratio (MAR)**: Talking state variance and speech detection.
* **Yawn Detection**: Prolonged mouth expansion (`MAR > 0.08` for > 1.8s).
* **3D Head-Pose Estimation**: Real-time Pitch, Yaw, and Roll calculations from 3D facial landmarks.
* **Ergonomic Posture Analysis**: Identifies upright posture vs slouching, downward pitch, or looking away.
* **Explainable AI (XAI)**: Generates clear, plain-English diagnostic justifications for every status transition.

#### 7. 📑 Compliance Reports & Multi-Format Exports
* Pre-built templates: Employee-wise summary, Daily Attendance, Drowsiness & Fatigue, Inactivity & Posture.
* **Executive PDF Export**: Formatted printable reports with letterhead, KPI summaries, and data tables.
* **Excel & CSV Export**: Standard spreadsheets compatible with enterprise HRMS systems.

#### 8. 🔐 Authentication & Role-Based Access Control (RBAC)
* Supported roles with granular permission gating:
  * **Admin**: Complete system oversight, camera configuration, user management, and settings.
  * **Manager**: Workstation monitoring, team attendance, activity analytics, and alert triage.
  * **HR**: Attendance compliance, employee directory, timecards, and privacy audits.
  * **Employee**: Personal attendance, personal work duration, and GDPR self-service data access.
* Instant role switcher in dashboard for live testing.

#### 9. 🛡️ Privacy, Ethics & Security
* **Transparent Notice & Consent**: Built-in employee transparency charter and signed consent tracking.
* **Privacy Blur Mode**: Optional real-time Gaussian pixel blur on camera output while preserving landmark calculation.
* **Edge Processing**: Zero raw video footage is ever stored or transmitted to remote servers.
* **Immutable Audit Trail**: ISO 27001-aligned logging of every administrative action, camera access, and export.
* **Data Portability**: Self-service GDPR JSON export of an employee's personal telemetry.

---

### 🚀 How to Run

#### Option 1: Native Python Desktop Application
Runs computer vision directly with OpenCV and MediaPipe Tasks on your local machine:

1. **Clone this repository**:
   ```bash
   git clone https://github.com/Ashwin-876/worksense-ai.git
   cd worksense-ai
   ```

2. **Install dependencies**:
   ```bash
   pip install opencv-python mediapipe numpy
   ```

3. **Start the application**:
   ```bash
   python main.py
   ```
   *Press `q` on the video window to quit.*

#### Option 2: Enterprise Web Dashboard (Vercel)
Runs completely client-side in any modern web browser with WebAssembly / WebGPU acceleration:

1. **Local preview**:
   ```bash
   npx serve .
   ```
   Open `http://localhost:3000` in your browser.

2. **Deploy to Vercel**:
   ```bash
   npx vercel --prod
   ```

Live deployment: [https://working-log-pink.vercel.app](https://working-log-pink.vercel.app)

---

### 📁 Project Structure

```
worksense-ai/
├── index.html                 # Enterprise SPA Dashboard shell
├── style.css                  # Responsive design with light-dark() CSS tokens
├── app.js                     # Main application controller & view router
├── package.json               # Project manifest
├── vercel.json                # Vercel deployment configuration
├── main.py                    # Python OpenCV application entrypoint
├── js/                        # Modular Client-Side Architecture
│   ├── state.js               # Central reactive state manager & localStorage
│   ├── auth.js                # Role-Based Access Control (RBAC)
│   ├── ai-engine.js           # MediaPipe FaceMesh, EAR/MAR, Yawning & Posture
│   ├── camera-manager.js      # Multi-camera hardware & RTSP orchestrator
│   ├── alerts.js              # Smart alert center & notification dispatcher
│   ├── analytics.js           # Activity timelines & SVG productivity charts
│   ├── reports.js             # Printable PDF & CSV/Excel export engine
│   └── privacy.js             # Transparency notice, blur mode & audit trail
├── trackers/                  # Python Computer Vision Modules
│   ├── advanced_ai_tracker.py # Head pose, yawning, posture & anomaly engine
│   ├── face_landmarker_wrapper.py # Unified MediaPipe Tasks wrapper
│   ├── eye_tracker.py         # Eye Aspect Ratio (EAR) calculator
│   ├── lip_movement.py        # Mouth Aspect Ratio (MAR) calculator
│   └── presence_tracker.py    # Facial presence detector
├── utils/                     # Python Utilities
│   ├── drawing_utils.py       # Landmark mesh and bounding box visualizer
│   ├── metric_utils.py        # Mathematical EAR and MAR routines
│   └── logging_utils.py       # CSV session logger
├── models/                    # MediaPipe Task Bundles
│   └── face_landmarker.task   # Pretrained 478-point 3D facial landmarker
└── data/                      # Local Storage
    └── presence_log.csv       # Formatted session log records
```
