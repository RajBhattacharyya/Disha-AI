from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
import base64
from io import BytesIO
from PIL import Image
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize YOLO model
try:
    model = YOLO("yolov8n.pt")  # Using YOLOv8 nano for speed
    print("YOLO model loaded successfully")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

# Initialize OpenAI client
try:
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key != "your_openai_api_key_here":
        client = OpenAI(api_key=api_key)
        print("OpenAI client initialized successfully")
    else:
        client = None
        print("OpenAI API key not configured - GPT-4 fallback will not be available")
except Exception as e:
    client = None
    print(f"Warning: Could not initialize OpenAI client: {e}")

# Emergency kit items for different disasters
DISASTER_KITS = {
    "tsunami": [
        "flashlight",
        "bottle",
        "backpack",
        "book",
        "cell phone",
        "handbag",
        "scissors",
        "knife",
        "bowl",
        "cup",
    ],
    "earthquake": [
        "flashlight",
        "bottle",
        "backpack",
        "book",
        "cell phone",
        "scissors",
        "knife",
        "bowl",
        "cup",
        "handbag",
    ],
    "hurricane": [
        "flashlight",
        "bottle",
        "backpack",
        "book",
        "cell phone",
        "umbrella",
        "handbag",
        "scissors",
        "tie",
        "bowl",
    ],
    "flood": [
        "flashlight",
        "bottle",
        "backpack",
        "book",
        "cell phone",
        "handbag",
        "umbrella",
        "scissors",
        "bowl",
        "cup",
    ],
    "wildfire": [
        "flashlight",
        "bottle",
        "backpack",
        "book",
        "cell phone",
        "handbag",
        "scissors",
        "knife",
        "bowl",
        "cup",
    ],
}

# COCO dataset classes that YOLO can detect
COCO_CLASSES = [
    "person",
    "bicycle",
    "car",
    "motorcycle",
    "airplane",
    "bus",
    "train",
    "truck",
    "boat",
    "traffic light",
    "fire hydrant",
    "stop sign",
    "parking meter",
    "bench",
    "bird",
    "cat",
    "dog",
    "horse",
    "sheep",
    "cow",
    "elephant",
    "bear",
    "zebra",
    "giraffe",
    "backpack",
    "umbrella",
    "handbag",
    "tie",
    "suitcase",
    "frisbee",
    "skis",
    "snowboard",
    "sports ball",
    "kite",
    "baseball bat",
    "baseball glove",
    "skateboard",
    "surfboard",
    "tennis racket",
    "bottle",
    "wine glass",
    "cup",
    "fork",
    "knife",
    "spoon",
    "bowl",
    "banana",
    "apple",
    "sandwich",
    "orange",
    "broccoli",
    "carrot",
    "hot dog",
    "pizza",
    "donut",
    "cake",
    "chair",
    "couch",
    "potted plant",
    "bed",
    "dining table",
    "toilet",
    "tv",
    "laptop",
    "mouse",
    "remote",
    "keyboard",
    "cell phone",
    "microwave",
    "oven",
    "toaster",
    "sink",
    "refrigerator",
    "book",
    "clock",
    "vase",
    "scissors",
    "teddy bear",
    "hair drier",
    "toothbrush",
]


def decode_image(image_data):
    """Decode base64 image to numpy array"""
    try:
        # Remove data URL prefix if present
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Decode base64
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))

        # Convert to numpy array
        image_array = np.array(image)

        # Convert RGB to BGR for OpenCV
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)

        return image_array
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None


def detect_objects_yolo(image):
    """Detect objects using YOLO"""
    try:
        results = model(image, conf=0.5)
        detected_objects = []

        for result in results:
            boxes = result.boxes
            for box in boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                class_name = COCO_CLASSES[class_id]

                detected_objects.append({"name": class_name, "confidence": confidence})

        return detected_objects
    except Exception as e:
        print(f"Error in YOLO detection: {e}")
        return None


def detect_objects_gpt(image_data, disaster_type):
    """Fallback: Use GPT-4 Vision to detect objects"""
    if client is None:
        print("GPT-4 client not available")
        return []

    try:
        required_items = DISASTER_KITS.get(disaster_type, [])

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Analyze this image and identify which of these emergency kit items are present: {', '.join(required_items)}. Return a JSON list of objects with 'name' and 'confidence' (0-1) fields for each item found.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data if ',' not in image_data else image_data.split(',')[1]}"
                            },
                        },
                    ],
                }
            ],
            max_tokens=500,
        )

        # Parse response
        content = response.choices[0].message.content
        # Try to extract JSON from the response
        import json
        import re

        # Look for JSON array in the response
        json_match = re.search(r"\[.*\]", content, re.DOTALL)
        if json_match:
            detected_objects = json.loads(json_match.group())
            return detected_objects

        return []
    except Exception as e:
        print(f"Error in GPT detection: {e}")
        return []


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify(
        {
            "status": "healthy",
            "yolo_available": model is not None,
            "gpt_available": client is not None,
        }
    )


@app.route("/api/detect-kit-items", methods=["POST"])
def detect_kit_items():
    """Detect emergency kit items in an image"""
    try:
        data = request.json
        image_data = data.get("image")
        disaster_type = data.get("disasterType", "tsunami").lower()

        if not image_data:
            return jsonify({"error": "No image provided"}), 400

        required_items = DISASTER_KITS.get(disaster_type, DISASTER_KITS["tsunami"])

        # YOLO real-time detection with bounding boxes
        detected_objects = []
        if model is not None:
            image = decode_image(image_data)
            if image is not None:
                results = model(image, conf=0.4)  # Lower confidence for more detections

                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        class_name = COCO_CLASSES[class_id]

                        # Only include items that are in the required checklist
                        # Check if detected item matches any checklist item (partial match)
                        is_required = False
                        for required_item in required_items:
                            if (
                                required_item.lower() in class_name.lower()
                                or class_name.lower() in required_item.lower()
                            ):
                                is_required = True
                                matched_name = required_item
                                break

                        if not is_required:
                            continue

                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].tolist()

                        detected_objects.append(
                            {
                                "name": matched_name,  # Use checklist name instead of COCO class
                                "confidence": confidence,
                                "bbox": {
                                    "x1": int(x1),
                                    "y1": int(y1),
                                    "x2": int(x2),
                                    "y2": int(y2),
                                },
                            }
                        )

        return jsonify(
            {
                "success": True,
                "disasterType": disaster_type,
                "requiredItems": required_items,
                "detectedObjects": detected_objects,
                "detectionMethod": "yolo",
            }
        )

    except Exception as e:
        print(f"Error in detect_kit_items: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/disaster-types", methods=["GET"])
def get_disaster_types():
    """Get list of supported disaster types"""
    return jsonify({"disasterTypes": list(DISASTER_KITS.keys())})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8014))
    print(f"Starting server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
