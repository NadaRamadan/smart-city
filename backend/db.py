from pymongo import MongoClient
from datetime import datetime
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

client = MongoClient(MONGO_URI)
db = client["smart_city"]
reports_col = db["reports"]

def insert_report(data: dict):
    data["timestamp"] = datetime.utcnow().isoformat()
    result = reports_col.insert_one(data)
    data.pop("_id", None)   
    return str(result.inserted_id)

def get_reports(limit: int = 500):
    return list(reports_col.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit))

def get_stats():
    pipeline = [
        {"$group": {"_id": "$type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    return list(reports_col.aggregate(pipeline))
