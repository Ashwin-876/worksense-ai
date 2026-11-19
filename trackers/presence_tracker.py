# presence_tracker.py

import cv2
import csv
from datetime import datetime
from trackers.face_landmarker_wrapper import SharedFaceLandmarker, DetectionResults

LOG_FILE = 'data/presence_log.csv'

class PresenceTracker:
    def __init__(self):
        self.landmarker = SharedFaceLandmarker.get_instance()
        # For legacy compatibility
        self.face_detection = self

    def process(self, rgb_frame):
        landmarks = self.landmarker.detect(rgb_frame)
        return DetectionResults(landmarks is not None)
    
    def detect_presence(self, frame, landmarks=None):
        if landmarks is not None:
            return len(landmarks) > 0
        detected_landmarks = self.landmarker.detect(frame)
        return detected_landmarks is not None

def init_log_file():
    try:
        with open(LOG_FILE, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['Date', 'Start Time', 'End Time', 'Duration (seconds)', 'Eye Status', 'Talking'])
    except:
        pass

def log_presence(start, end, duration, eye_status, mouth_status):
    with open(LOG_FILE, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([datetime.now().date(), start, end, round(duration), eye_status, mouth_status])
