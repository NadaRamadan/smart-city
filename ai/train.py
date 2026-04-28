"""
Smart City YOLOv8 Training Script
==================================
Detects: garbage, pollution, smoke

Usage:
    pip install ultralytics
    python train.py

Dataset folder structure:
    ai/dataset/
    ├── data.yaml
    ├── images/
    │   ├── train/   (80%)
    │   └── val/     (20%)
    └── labels/
        ├── train/
        └── val/

data.yaml content:
    path: ./dataset
    train: images/train
    val: images/val
    names:
      0: garbage
      1: pollution
      2: smoke
"""

from ultralytics import YOLO

def train():
    model = YOLO("yolov8n.pt")  # nano = fastest; use yolov8s.pt for better accuracy

    results = model.train(
        data="dataset/data.yaml",
        epochs=50,
        imgsz=640,
        batch=16,
        name="smart_city_v1",
        patience=10,           # early stopping
        save=True,
        device="0",            # GPU; use "cpu" if no GPU
    )

    print("Training complete. Best model saved to: runs/detect/smart_city_v1/weights/best.pt")
    print("Copy best.pt to backend/best.pt to deploy.")
    return results


def validate():
    model = YOLO("runs/detect/smart_city_v1/weights/best.pt")
    metrics = model.val()
    print(f"mAP50: {metrics.box.map50:.3f}")
    print(f"mAP50-95: {metrics.box.map:.3f}")
    return metrics


if __name__ == "__main__":
    train()
