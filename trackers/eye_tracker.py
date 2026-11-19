from utils.metric_utils import calculate_ear
from trackers.face_landmarker_wrapper import SharedFaceLandmarker
import cv2

class EyeTracker:
    def __init__(self, ear_threshold=0.25):
        self.landmarker = SharedFaceLandmarker.get_instance()
        self.face_mesh = self.landmarker  # For legacy compatibility
        self.EAR_THRESHOLD = ear_threshold
        self.LEFT_EYE = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE = [362, 385, 387, 263, 373, 380]
        
    def detect_eye_state(self, frame, landmarks=None):
        if landmarks is None:
            landmarks = self.landmarker.detect(frame)

        if landmarks is not None and len(landmarks) > 0:
            h, w, _ = frame.shape
            left_ear = calculate_ear(self.LEFT_EYE, landmarks, w, h)
            right_ear = calculate_ear(self.RIGHT_EYE, landmarks, w, h)
            avg_ear = (left_ear + right_ear) / 2.0
            eyes_closed = avg_ear < self.EAR_THRESHOLD
            return "Eyes Closed" if eyes_closed else "Eyes Open", round(avg_ear, 2)
        return "Unknown", 0.0
