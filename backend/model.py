from ultralytics import YOLO
import os

_models = {}

def load_models():
    global _models
    model_files = {
        "garbage":   "garbage.pt",
        "smoke":     "smoke.pt",
        "pollution": "pollution.pt",
    }
    for label, filename in model_files.items():
        if label not in _models:
            if not os.path.exists(filename):
                print(f"WARNING: {filename} not found, skipping {label} detection")
                continue
            _models[label] = YOLO(filename)
    return _models

def predict(image_path: str) -> dict:
    models = load_models()

    if not models:
        raise FileNotFoundError("No models found. Add garbage.pt, smoke.pt or pollution.pt to backend folder")

    all_detections = []

    for label, model in models.items():
        try:
            results = model(image_path, verbose=False)
            for r in results:
                for box in r.boxes:
                    conf = float(box.conf[0])
                    if conf > 0.3:  # ignore very low confidence
                        all_detections.append({
                            "type": label,
                            "confidence": round(conf, 4),
                            "bbox": [round(x) for x in box.xyxy[0].tolist()]
                        })
        except Exception as e:
            print(f"Error running {label} model: {e}")
            continue

    if not all_detections:
        return {"type": "clean", "confidence": 0.99, "all_detections": []}

    best = max(all_detections, key=lambda x: x["confidence"])
    best["all_detections"] = all_detections
    return best