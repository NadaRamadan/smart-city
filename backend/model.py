from ultralytics import YOLO
import os
import threading

MODEL_PATH = os.getenv("MODEL_PATH", "best.pt")

_model = None
_lock = threading.Lock()

def get_model():
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                if not os.path.exists(MODEL_PATH):
                    raise FileNotFoundError(
                        f"Model file '{MODEL_PATH}' not found. "
                        "Train your model first: see ai/train.py"
                    )
                _model = YOLO(MODEL_PATH)
    return _model


def predict(image_path: str) -> dict:
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    model = get_model()
    results = model.predict(source=image_path, verbose=False)

    detections = []

    for r in results:
        for box in r.boxes:
            cls = int(box.cls.item() if hasattr(box.cls, "item") else box.cls)
            conf = float(box.conf.item() if hasattr(box.conf, "item") else box.conf)
            label = model.names[cls]

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "type": label,
                "confidence": round(conf, 4),
                "bbox": [round(x1), round(y1), round(x2), round(y2)]
            })

    if not detections:
        return {
            "type": "clean",
            "confidence": 0.99,
            "bbox": None,
            "all_detections": []
        }

    best = max(detections, key=lambda x: x["confidence"])

    return {
        "type": best["type"],
        "confidence": best["confidence"],
        "bbox": best["bbox"],
        "all_detections": detections
    }