# Quick Start Guide

## Starting All Services

### 1. Terminal 1 - Node.js Server

```powershell
cd credio-server
npm install  # First time only
npm start
```

### 2. Terminal 2 - AI Server

```powershell
cd credio-ai-server

# First time setup
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start server
python app.py
```

### 3. Terminal 3 - Client

```powershell
cd credio-client
npm install  # First time only
npm run dev
```

## Accessing the Application

- **Client**: http://localhost:3000
- **Emergency Kit Scanner**: http://localhost:3000/emergency/kit
- **Node.js API**: http://localhost:3001
- **AI Server**: http://localhost:5000

## Testing the AI Server

```powershell
cd credio-ai-server
.\venv\Scripts\Activate.ps1
python test_server.py
```

## Common Issues

### Python Virtual Environment

If activation fails, try:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use

- Node Server: Change PORT in `credio-server/.env`
- AI Server: Change PORT in `credio-ai-server/.env`
- Client: Change port in `credio-client/package.json` dev script

### Camera Not Working

- Use HTTPS or localhost (required by most browsers)
- Grant camera permissions when prompted
- Check browser console for errors

## Quick Test

1. Open http://localhost:3000/emergency/kit
2. Select "Tsunami"
3. Click "Start Camera"
4. Point camera at items (flashlight, water bottle, etc.)
5. Click "Scan Items"
6. View detected items in checklist
