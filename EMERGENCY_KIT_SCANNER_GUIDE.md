# Emergency Kit Scanner - Setup Guide

## Overview

The Emergency Kit Scanner is a new feature that allows users to verify their emergency preparedness by scanning items using their device camera. The system uses AI to detect objects and match them against disaster-specific emergency kit checklists.

## Architecture

### Components

1. **Frontend (React/Next.js)**: Camera interface and user interaction
2. **AI Server (Python/Flask)**: Object detection using YOLO and GPT-4 Vision
3. **Detection Pipeline**: Two-tier detection system

### Detection Methods

- **Primary**: YOLOv8 (Ultralytics) - Fast, local object detection
- **Fallback**: GPT-4 Vision API - Cloud-based AI when YOLO is unavailable

## Setup Instructions

### 1. Install Python Dependencies

Navigate to the AI server directory:

```bash
cd credio-ai-server
```

Create and activate a virtual environment:

**Windows PowerShell:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows CMD:**

```cmd
python -m venv venv
.\venv\Scripts\activate.bat
```

**Linux/Mac:**

```bash
python3 -m venv venv
source venv/bin/activate
```

Install required packages:

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `credio-ai-server` directory:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-api-key-here
PORT=5000
FLASK_ENV=development
```

### 3. Download YOLO Model (Automatic)

When you first run the server, YOLOv8 nano model will be automatically downloaded. This is a one-time download (~6MB).

### 4. Start the AI Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

You should see:

```
YOLO model loaded successfully
 * Running on http://0.0.0.0:5000
```

### 5. Test the Server

Health check:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "status": "healthy",
  "yolo_available": true,
  "gpt_available": true
}
```

### 6. Configure Client

The client is already configured to connect to `http://localhost:5000`. If you need to change this, update the API endpoint in:
`credio-client/components/emergency/EmergencyKitScanner.tsx`

## Usage

### Using the Emergency Kit Scanner

1. Navigate to the Emergency Kit page: `http://localhost:3000/emergency/kit`
2. Select a disaster type (Tsunami, Earthquake, Hurricane, Flood, or Wildfire)
3. Click "Start Camera" to activate your device camera
4. Position items in view of the camera
5. Click "Scan Items" to detect objects
6. Review the checklist to see which items were found

### Supported Disaster Types

Each disaster type has a specific emergency kit checklist:

#### Tsunami

- Flashlight, Water bottle, Backpack, Important documents/book
- Cell phone, Handbag, Scissors, Knife, Bowl, Cup

#### Earthquake

- Flashlight, Water bottle, Backpack, Important documents/book
- Cell phone, Scissors, Knife, Bowl, Cup, Handbag

#### Hurricane

- Flashlight, Water bottle, Backpack, Important documents/book
- Cell phone, Umbrella, Handbag, Scissors, Tie, Bowl

#### Flood

- Flashlight, Water bottle, Backpack, Important documents/book
- Cell phone, Handbag, Umbrella, Scissors, Bowl, Cup

#### Wildfire

- Flashlight, Water bottle, Backpack, Important documents/book
- Cell phone, Handbag, Scissors, Knife, Bowl, Cup

## API Reference

### GET /health

Health check endpoint

**Response:**

```json
{
  "status": "healthy",
  "yolo_available": true,
  "gpt_available": true
}
```

### POST /api/detect-kit-items

Detect emergency kit items in an image

**Request:**

```json
{
  "image": "data:image/jpeg;base64,...",
  "disasterType": "tsunami"
}
```

**Response:**

```json
{
  "success": true,
  "disasterType": "tsunami",
  "requiredItems": ["flashlight", "bottle", "backpack", ...],
  "checklist": [
    {
      "name": "flashlight",
      "detected": true,
      "confidence": 0.95
    },
    {
      "name": "bottle",
      "detected": false,
      "confidence": 0
    }
  ],
  "detectionMethod": "yolo"
}
```

### GET /api/disaster-types

Get list of supported disaster types

**Response:**

```json
{
  "disasterTypes": ["tsunami", "earthquake", "hurricane", "flood", "wildfire"]
}
```

## Troubleshooting

### Issue: Camera not working

- **Solution**: Ensure browser has camera permissions
- Check browser console for errors
- Try using HTTPS (some browsers require secure context)

### Issue: YOLO model not loading

- **Solution**: Check internet connection for first-time download
- Ensure sufficient disk space (~500MB)
- Check Python version (3.9+ required)

### Issue: GPT-4 Vision errors

- **Solution**: Verify OpenAI API key is valid
- Check API quota/credits
- Ensure stable internet connection

### Issue: Low detection accuracy

- **Solution**: Improve lighting conditions
- Position items clearly in camera view
- Reduce background clutter
- Use items that closely match COCO dataset classes

### Issue: CORS errors

- **Solution**: Ensure AI server is running on port 5000
- Check Flask-CORS is installed
- Verify client is making requests to correct endpoint

## Performance Optimization

### For Better Detection:

1. **Good Lighting**: Ensure adequate lighting for clear images
2. **Clear Background**: Remove cluttered backgrounds
3. **Item Positioning**: Place items prominently in frame
4. **Distance**: Keep items 1-3 feet from camera
5. **Multiple Angles**: Try different angles if detection fails

### For Faster Processing:

- Use YOLO (primary method) - typically 100-500ms per frame
- GPT-4 Vision (fallback) is slower but more accurate

## Security Considerations

1. **API Keys**: Never commit `.env` file to version control
2. **Camera Access**: Only requested when user clicks "Start Camera"
3. **Image Data**: Images are processed in memory, not stored
4. **CORS**: Configured for localhost development (update for production)

## Future Enhancements

Potential improvements:

- [ ] Real-time continuous detection (video stream)
- [ ] Custom disaster kit checklists
- [ ] Offline mode with cached YOLO model
- [ ] Multi-language support for item names
- [ ] Export checklist as PDF
- [ ] Integration with main database
- [ ] User history of scanned kits
- [ ] AR overlays for missing items

## License

This component is part of the Credio project and follows the same MIT License.
