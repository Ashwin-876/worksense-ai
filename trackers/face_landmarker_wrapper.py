import os
import urllib.request
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'face_landmarker.task')
MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

def ensure_model_exists():
    if not os.path.exists(MODEL_PATH):
        os.makedirs(MODEL_DIR, exist_ok=True)
        print("Downloading face_landmarker model...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("Model downloaded successfully.")
    return MODEL_PATH

class FaceLandmarksWrapper(list):
    """Wrapper around landmarks list to support both .landmark attribute and direct indexing."""
    @property
    def landmark(self):
        return self

class MeshResults:
    def __init__(self, face_landmarks):
        self.multi_face_landmarks = [FaceLandmarksWrapper(face_landmarks)] if face_landmarks else []

class DetectionResults:
    def __init__(self, detected):
        self.detections = [True] if detected else None

class SharedFaceLandmarker:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        model_path = ensure_model_exists()
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1
        )
        self.detector = vision.FaceLandmarker.create_from_options(options)

    def detect(self, frame_or_rgb):
        """Returns FaceLandmarksWrapper or None."""
        if frame_or_rgb is None:
            return None
        # Convert BGR frame to RGB if needed
        rgb_frame = cv2.cvtColor(frame_or_rgb, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result = self.detector.detect(mp_image)
        if result.face_landmarks and len(result.face_landmarks) > 0:
            return FaceLandmarksWrapper(result.face_landmarks[0])
        return None

    def process(self, rgb_image):
        """Compatibility method for legacy face_mesh.process."""
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
        result = self.detector.detect(mp_image)
        return MeshResults(result.face_landmarks[0] if result.face_landmarks else None)

