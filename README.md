# WorkSense AI – Employee Monitoring System

**WorkSense AI**\
*AI-Powered Employee Monitoring System*

This project is a real-time **Employee Monitoring System** that uses **OpenCV** and **MediaPipe** to determine whether a person is working or distracted based on:

* **Eye status** (closed for > 5 minutes)
* **Face presence** (absent for > 2 minutes)
* **Mouth activity** (talking continuously or talk events exceeding threshold)

The system logs sessions to a CSV file to track whether the person was actively working or distracted, and is available both as a native Python desktop application and as a client-side Web dashboard deployable on Vercel.

### 🌟 Features

* **Eye Tracking** – Detects if eyes are closed using EAR (Eye Aspect Ratio).
* **Face Presence Detection** – Logs absence if face not detected for over 2 minutes.
* **Mouth Movement Tracking** – Detects if a person is talking continuously (based on MAR - Mouth Aspect Ratio).
* **Logs Output** – Records date, start/end time, duration, and working status in CSV format.
* **Dual Runtime** – Native Python desktop app with OpenCV + modern Web Dashboard with MediaPipe FaceMesh running in-browser.

### 🧠 How It Works

**WorkSense AI** uses **MediaPipe FaceMesh** to detect facial landmarks:

1. **Eye Aspect Ratio (EAR)** is computed from eye contour landmarks to detect closed eyes.
2. **Mouth Aspect Ratio (MAR)** and variance are computed to detect talking states.
3. **Face Landmark Detection** identifies whether the face is visible (i.e. present).

The evaluation logic logs the session as:

* `Not Working` if:
  * Eyes are closed for more than **5 minutes**, or
  * Face is **not detected** for more than **2 minutes**, or
  * Talking events occur **4 times or more** in a 1-minute window
* `Working` otherwise.

### 🚀 How to Run

#### Option 1: Python Desktop App

1. **Clone this repo**

   ```bash
   git clone https://github.com/Ashwin-876/worksense-ai.git
   cd worksense-ai
   ```

2. **Install dependencies**

   ```bash
   pip install opencv-python mediapipe
   ```

3. **Start the App**

   ```bash
   python main.py
   ```

#### Option 2: Web Dashboard (Vercel)

Open the live web dashboard or deploy directly to Vercel:
```bash
npx vercel --prod
```

### 📊 Output Log

Logs are saved in `data/presence_log.csv` and downloadable directly from the web dashboard:

| Date       | Start Time | End Time | Duration (s) | Status      |
| ---------- | ---------- | -------- | ------------ | ----------- |
| 2026-11-19 | 10:12:00   | 10:15:30 | 210          | Working     |
| 2026-11-19 | 11:02:12   | 11:07:14 | 302          | Not Working |

---

### 📌 Credits

Developed by:
👩‍🎓 Data Science Student @ IIT Madras
🔗 Email: [2jyotihill@gmail.com](mailto:2jyotihill@gmail.com)
