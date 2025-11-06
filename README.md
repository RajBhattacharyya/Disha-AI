# 🌟 Credio - Emergency Response & Disaster Management Platform

A comprehensive platform for emergency situations, disaster response, and community safety with AI-powered features.

## 🚀 New Feature: Emergency Kit Scanner

**AI-powered emergency preparedness verification using live camera and YOLO object detection!**

📸 Scan your emergency kit items with your camera
🤖 Powered by YOLOv8 and GPT-4 Vision
✅ Disaster-specific checklists (Tsunami, Earthquake, Hurricane, Flood, Wildfire)
📊 Real-time confidence scores

👉 **[Quick Start Guide](./QUICK_START.md)** | **[Setup Checklist](./SETUP_CHECKLIST.md)** | **[Complete Guide](./EMERGENCY_KIT_SCANNER_GUIDE.md)**

---

## 📁 Project Structure

```
credio/
├── 🐍 credio-ai-server/      # Python AI server (YOLO + GPT-4)
├── ⚛️ credio-client/          # Next.js frontend
└── 🟢 credio-server/          # Node.js backend API
```

### Components

| Component     | Technology                   | Port | Purpose                                     |
| ------------- | ---------------------------- | ---- | ------------------------------------------- |
| **AI Server** | Python + Flask + YOLO        | 5000 | Object detection for emergency kit scanning |
| **Client**    | Next.js + React + TypeScript | 3000 | User interface and interactions             |
| **Backend**   | Node.js + Express + Prisma   | 3001 | API, database, business logic               |

---

## ✨ Key Features

### 🆕 Emergency Kit Scanner

- 📱 Live camera scanning
- 🔍 AI object detection (YOLO + GPT-4)
- 📋 Disaster-specific checklists
- ✅ Real-time verification
- 📊 Confidence scoring

### 🚨 Emergency Management

- SOS button for instant help
- Resource tracking
- Disaster alerts
- Location-based services

### 💬 Real-time Communication

- AI assistant chat
- WebSocket updates
- Multi-language support

### 🗺️ Geolocation Features

- Interactive maps
- Geofencing
- Location-based alerts

---

## 🎯 Quick Start

### Prerequisites

- Node.js 16+
- Python 3.9+
- PostgreSQL
- OpenAI API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/RajBhattacharyya/credio.git
cd credio
```

### Option 1: Automated Setup (Windows)

```powershell
.\setup-emergency-kit.ps1
```

### Option 2: Manual Setup

#### 1️⃣ Setup AI Server

```powershell
cd credio-ai-server
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Add your OPENAI_API_KEY to .env
python app.py
```

#### 2️⃣ Setup Node.js Server

```powershell
cd credio-server
npm install
# Configure .env with database credentials
npm start
```

#### 3️⃣ Setup Client

```powershell
cd credio-client
npm install
npm run dev
```

### Access the Application

- 🌐 **Client**: http://localhost:3000
- 📸 **Emergency Kit**: http://localhost:3000/emergency/kit
- 🔌 **API**: http://localhost:3001
- 🤖 **AI Server**: http://localhost:5000

---

## 📚 Documentation

| Document                                                                  | Description                     |
| ------------------------------------------------------------------------- | ------------------------------- |
| 🚀 [QUICK_START.md](./QUICK_START.md)                                     | Fast startup guide              |
| ✅ [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)                             | Step-by-step setup verification |
| 📸 [EMERGENCY_KIT_SCANNER_GUIDE.md](./EMERGENCY_KIT_SCANNER_GUIDE.md)     | Complete feature guide          |
| 🏗️ [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)                   | Visual architecture             |
| 📝 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)                           | Project documentation           |
| ⚡ [FEATURE_EMERGENCY_KIT_SCANNER.md](./FEATURE_EMERGENCY_KIT_SCANNER.md) | Feature implementation details  |
| ✨ [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)             | Complete implementation summary |

---

## 🛠️ Technology Stack

### Frontend

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **WebSocket** - Real-time communication

### AI Server

- **Python 3.9+** - Programming language
- **Flask** - Web framework
- **YOLOv8** - Object detection
- **OpenCV** - Computer vision
- **PyTorch** - Deep learning
- **GPT-4 Vision** - Fallback AI

---

## 🎨 Usage Example

### Emergency Kit Scanner

```typescript
// 1. User selects disaster type
const disasterType = "tsunami";

// 2. User starts camera and captures image
const imageData = captureFromCamera();

// 3. Send to AI server for detection
const response = await fetch("http://localhost:5000/api/detect-kit-items", {
  method: "POST",
  body: JSON.stringify({ image: imageData, disasterType }),
});

// 4. Display results
const { checklist } = await response.json();
// checklist: [{ name: "flashlight", detected: true, confidence: 0.95 }, ...]
```

---

## 🧪 Testing

### Test AI Server

```bash
cd credio-ai-server
python test_server.py
```

### Test Full Flow

1. Open http://localhost:3000/emergency/kit
2. Select a disaster type
3. Start camera
4. Scan items
5. Verify checklist

---

## 🔒 Security

- 🔐 API keys stored in .env files
- 📸 Camera access requires user permission
- 🗑️ Images processed in memory, not stored
- 🛡️ CORS configured for development
- 🔑 Environment-based configuration

---

## 📈 Performance

| Metric             | Value       |
| ------------------ | ----------- |
| YOLO Detection     | 100-500ms   |
| GPT-4 Vision       | 2-5 seconds |
| YOLOv8 Model Size  | ~6MB        |
| Image Capture Size | 200-500KB   |

---

## 🗺️ Roadmap

### Current Features

- ✅ Emergency Kit Scanner
- ✅ Disaster Management
- ✅ AI Chat Assistant
- ✅ Real-time Alerts
- ✅ Interactive Maps

### Future Enhancements

- [ ] Real-time video detection
- [ ] Offline mode
- [ ] Custom checklists
- [ ] History tracking
- [ ] Multi-language support
- [ ] AR overlays
- [ ] PDF export
- [ ] Barcode scanning

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

**Credio Development Team**

- Repository: [github.com/RajBhattacharyya/credio](https://github.com/RajBhattacharyya/credio)

---

## 🆘 Support

### Common Issues

| Issue              | Solution                          |
| ------------------ | --------------------------------- |
| Camera not working | Grant browser permissions         |
| Python venv fails  | Set execution policy              |
| YOLO not loading   | Check internet for first download |
| GPT-4 errors       | Verify API key in .env            |

### Getting Help

1. Check [EMERGENCY_KIT_SCANNER_GUIDE.md](./EMERGENCY_KIT_SCANNER_GUIDE.md) troubleshooting
2. Review [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
3. Check browser console for errors
4. Verify all three servers are running

---

## 🎉 Acknowledgments

- **Ultralytics** for YOLOv8
- **OpenAI** for GPT-4 Vision
- **Next.js** team
- **React** team
- Open source community

---

<div align="center">

**Built with ❤️ for Emergency Preparedness**

🌟 Star this repo | 🐛 Report bugs | 💡 Request features

</div>
