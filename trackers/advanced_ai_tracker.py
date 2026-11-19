import time
import math
import numpy as np

class AdvancedAITracker:
    def __init__(self, yawn_mar_threshold=0.08, yawn_min_duration=1.8):
        self.yawn_mar_threshold = yawn_mar_threshold
        self.yawn_min_duration = yawn_min_duration
        
        # Yawning state
        self.yawn_start_time = None
        self.is_yawning = False
        self.yawn_count = 0
        self.recent_yawns = []  # Timestamps of yawns in past 5 mins
        
        # Micro-sleep state (rapid closures)
        self.eye_closures = []  # Timestamps of eye closure starts
        self.micro_sleeps_detected = 0
        
        # Posture baseline
        self.initial_nose_y = None

    def estimate_head_pose(self, landmarks, w, h):
        """
        Estimates Pitch, Yaw, Roll using 3D facial landmarks.
        Returns: (pitch, yaw, roll) in degrees.
        """
        if landmarks is None or len(landmarks) < 478:
            return 0.0, 0.0, 0.0
            
        nose = landmarks[1]
        chin = landmarks[152]
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        forehead = landmarks[10]

        # Roll: rotation around z-axis (tilt left/right)
        dx = (right_eye.x - left_eye.x) * w
        dy = (right_eye.y - left_eye.y) * h
        roll = math.degrees(math.atan2(dy, dx))

        # Yaw: rotation around y-axis (looking left/right)
        eye_mid_x = (left_eye.x + right_eye.x) / 2.0
        eye_dist = max(abs(right_eye.x - left_eye.x), 1e-4)
        yaw = ((nose.x - eye_mid_x) / (eye_dist / 2.0)) * 45.0

        # Pitch: rotation around x-axis (looking up/down)
        face_height = max(abs(chin.y - forehead.y), 1e-4)
        mid_eye_y = (left_eye.y + right_eye.y) / 2.0
        nose_rel_y = (nose.y - mid_eye_y) / face_height
        # Expected ratio for upright face is ~0.35
        pitch = (nose_rel_y - 0.35) * 80.0

        return round(pitch, 1), round(yaw, 1), round(roll, 1)

    def detect_yawn(self, mar, current_time):
        """
        Detects yawning when MAR exceeds threshold for sustained duration.
        Returns: (is_yawning, yawn_count)
        """
        is_currently_wide = mar > self.yawn_mar_threshold
        yawn_registered = False

        if is_currently_wide:
            if self.yawn_start_time is None:
                self.yawn_start_time = current_time
            elif (current_time - self.yawn_start_time) >= self.yawn_min_duration and not self.is_yawning:
                self.is_yawning = True
                self.yawn_count += 1
                self.recent_yawns.append(current_time)
                yawn_registered = True
        else:
            self.yawn_start_time = None
            self.is_yawning = False

        # Clean old yawns older than 5 minutes
        self.recent_yawns = [t for t in self.recent_yawns if current_time - t <= 300]
        return self.is_yawning, self.yawn_count, yawn_registered

    def analyze_posture(self, pitch, yaw, roll, landmarks=None):
        """
        Evaluates employee workstation posture.
        Returns: posture_label, description
        """
        if abs(yaw) > 28.0:
            return "Looking Away", f"Head turned {abs(yaw):.0f}° away from screen"
        if pitch < -20.0:
            return "Slouching / Looking Down", f"Head pitched down by {abs(pitch):.0f}°"
        if abs(roll) > 22.0:
            return "Head Tilted", f"Head tilted by {abs(roll):.0f}°"
        return "Good Posture", "Head upright facing workstation"

    def evaluate_anomalies(self, eye_status, ear, mar, is_present, current_time, continuous_closed_s):
        """
        Performs anomaly detection and generates Explainable AI (XAI) summaries.
        Returns: (anomaly_flag, anomaly_type, xai_summary)
        """
        # 1. Drowsiness / Micro-sleep Anomaly
        if continuous_closed_s > 10.0:
            return True, "Drowsiness", f"Eyes remained continuously closed for {int(continuous_closed_s)}s (EAR: {ear:.2f} < 0.25 threshold)."
        if len(self.recent_yawns) >= 3:
            return True, "Frequent Yawning", f"Detected {len(self.recent_yawns)} yawn events in past 5 minutes, indicating severe fatigue."

        # 2. Absence Anomaly
        if not is_present:
            return False, "Absence", "Employee has stepped away from the workstation camera frame."

        # 3. Excessive talking / disturbance
        if mar > 0.06:
            return False, "Active Communication", f"Active mouth movement detected (MAR: {mar:.3f})."

        return False, "Normal", "Employee is actively working with normal engagement."

