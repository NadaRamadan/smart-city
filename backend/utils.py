import os
import uuid
from fastapi import UploadFile

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 10

async def save_image(file: UploadFile) -> tuple[str, str]:
    if file.content_type not in ALLOWED_TYPES:
        raise ValueError(f"Invalid file type: {file.content_type}. Allowed: JPEG, PNG, WEBP")

    content = await file.read()

    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise ValueError(f"File too large. Max size: {MAX_SIZE_MB}MB")

    file_id = str(uuid.uuid4())
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    path = os.path.join(UPLOAD_DIR, f"{file_id}.{ext}")

    with open(path, "wb") as f:
        f.write(content)

    return path, file_id
