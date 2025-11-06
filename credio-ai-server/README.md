# Credio AI Server

AI-powered object detection server for emergency kit verification using YOLO and OpenAI GPT-4 Vision.

## Features

- Real-time object detection using YOLOv8
- Fallback to GPT-4 Vision API when YOLO fails
- Emergency kit checklist for different disaster types
- RESTful API for integration with Credio client

## Setup

1. Install Python 3.9 or higher

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create `.env` file:

```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env`:

```
OPENAI_API_KEY=your_key_here
```

5. Run the server:

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### GET /health

Health check endpoint

```json
{
  "status": "healthy",
  "yolo_available": true,
  "gpt_available": true
}
```

### POST /api/detect-kit-items

Detect emergency kit items in an image

```json
{
  "image": "base64_encoded_image",
  "disasterType": "tsunami"
}
```

Response:

```json
{
  "success": true,
  "disasterType": "tsunami",
  "requiredItems": ["flashlight", "bottle", ...],
  "checklist": [
    {
      "name": "flashlight",
      "detected": true,
      "confidence": 0.95
    }
  ],
  "detectionMethod": "yolo"
}
```

### GET /api/disaster-types

Get list of supported disaster types

```json
{
  "disasterTypes": ["tsunami", "earthquake", "hurricane", "flood", "wildfire"]
}
```

## Supported Disaster Types

- Tsunami
- Earthquake
- Hurricane
- Flood
- Wildfire

Each disaster type has a specific emergency kit checklist.
