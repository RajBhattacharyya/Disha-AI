# 📋 Emergency Kit Scanner - Setup Checklist

Use this checklist to ensure everything is set up correctly.

## ✅ Pre-Installation Checklist

- [ ] Python 3.9 or higher installed

  ```powershell
  python --version
  ```

  Expected: `Python 3.9.x` or higher

- [ ] Node.js 16+ installed

  ```powershell
  node --version
  ```

  Expected: `v16.x.x` or higher

- [ ] Git repository is up to date

  ```powershell
  git pull origin main
  ```

- [ ] OpenAI API account created
  - [ ] Visit https://platform.openai.com
  - [ ] Create account or sign in
  - [ ] Generate API key: https://platform.openai.com/api-keys
  - [ ] Save API key securely

## ✅ AI Server Setup

- [ ] Navigate to AI server directory

  ```powershell
  cd credio-ai-server
  ```

- [ ] Create virtual environment

  ```powershell
  python -m venv venv
  ```

  ✓ Should create `venv` folder

- [ ] Activate virtual environment

  ```powershell
  # Windows PowerShell
  .\venv\Scripts\Activate.ps1
  ```

  ✓ Should see `(venv)` in prompt

- [ ] If activation fails, set execution policy

  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

- [ ] Install Python dependencies

  ```powershell
  pip install -r requirements.txt
  ```

  ✓ Should install: Flask, OpenCV, YOLO, OpenAI, etc.
  ⏱️ Takes 3-5 minutes

- [ ] Create .env file

  ```powershell
  copy .env.example .env
  ```

  ✓ Should create `.env` file

- [ ] Add OpenAI API key to .env

  ```
  OPENAI_API_KEY=sk-your-actual-key-here
  PORT=5000
  FLASK_ENV=development
  ```

  ⚠️ Replace `your-actual-key-here` with your real key

- [ ] Test AI server startup

  ```powershell
  python app.py
  ```

  Expected output:

  ```
  YOLO model loaded successfully
   * Running on http://0.0.0.0:5000
  ```

- [ ] Test health endpoint (in new terminal)
  ```powershell
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

## ✅ Client Setup

- [ ] Navigate to client directory (new terminal)

  ```powershell
  cd credio-client
  ```

- [ ] Install dependencies (if not done)

  ```powershell
  npm install
  ```

- [ ] Start development server
  ```powershell
  npm run dev
  ```
  Expected output:
  ```
  ▲ Next.js 14.x.x
  - Local:   http://localhost:3000
  ```

## ✅ Node.js Server Setup

- [ ] Navigate to server directory (new terminal)

  ```powershell
  cd credio-server
  ```

- [ ] Install dependencies (if not done)

  ```powershell
  npm install
  ```

- [ ] Start server
  ```powershell
  npm start
  ```
  Expected: Server running on configured port

## ✅ Feature Testing

- [ ] Open browser to http://localhost:3000

- [ ] Navigate to Emergency Kit page

  - Click "Emergency Kit" in navigation
  - OR visit: http://localhost:3000/emergency/kit

- [ ] Test disaster type selection

  - [ ] Can see 5 disaster cards
  - [ ] Cards are clickable
  - [ ] Each has appropriate icon

- [ ] Test camera functionality

  - [ ] Click "Start Camera" button
  - [ ] Browser asks for camera permission
  - [ ] Grant camera permission
  - [ ] Live camera feed appears

- [ ] Test object detection

  - [ ] Position items in view (flashlight, bottle, etc.)
  - [ ] Click "Scan Items" button
  - [ ] Wait for detection (2-5 seconds)
  - [ ] Checklist appears with results

- [ ] Verify detection results

  - [ ] Items are listed with checkmarks
  - [ ] Detected items show confidence %
  - [ ] Undetected items show X mark
  - [ ] Progress percentage displayed

- [ ] Test different disaster types
  - [ ] Go back to disaster selection
  - [ ] Try different disaster type
  - [ ] Scan items again
  - [ ] Verify different checklist

## ✅ Troubleshooting Verification

- [ ] Check browser console (F12)

  - [ ] No red error messages
  - [ ] API calls succeed (200 status)

- [ ] Check AI server logs

  - [ ] No Python errors
  - [ ] Detection method logged
  - [ ] Requests processed successfully

- [ ] Test fallback mechanism
  - [ ] Stop YOLO (if needed for testing)
  - [ ] Should fall back to GPT-4
  - [ ] Still returns results

## ✅ Documentation Review

- [ ] Read QUICK_START.md
- [ ] Review EMERGENCY_KIT_SCANNER_GUIDE.md
- [ ] Check ARCHITECTURE_DIAGRAM.md
- [ ] Understand API endpoints

## 🎯 Success Criteria

You're ready when:

- ✅ All three servers running (AI, Node, Client)
- ✅ Can access Emergency Kit page
- ✅ Camera works and shows live feed
- ✅ Scanning detects objects
- ✅ Checklist updates correctly
- ✅ No console errors

## 📊 Final Verification

Run through this complete flow once:

1. **Open** http://localhost:3000/emergency/kit
2. **Select** "Tsunami"
3. **Click** "Start Camera"
4. **Show** flashlight to camera
5. **Click** "Scan Items"
6. **Verify** flashlight detected with checkmark
7. **Check** confidence score shows (e.g., "95% confident")

## 🎉 You're Done!

If all checkboxes are checked, your Emergency Kit Scanner is fully operational!

## 📝 Notes Section

Use this space for any issues or notes:

```
Issue: _____________________________________________
Solution: __________________________________________

Issue: _____________________________________________
Solution: __________________________________________

Issue: _____________________________________________
Solution: __________________________________________
```

## 🚨 Common Issues & Quick Fixes

| Issue               | Quick Fix                 |
| ------------------- | ------------------------- |
| Python not found    | Install from python.org   |
| Can't activate venv | Set execution policy      |
| Camera not working  | Grant browser permissions |
| YOLO not loading    | Wait for first download   |
| GPT-4 errors        | Check API key in .env     |
| Port in use         | Change PORT in .env       |
| CORS errors         | Ensure AI server on :5000 |

## 📞 Getting Help

If stuck:

1. Check error messages carefully
2. Review troubleshooting in EMERGENCY_KIT_SCANNER_GUIDE.md
3. Verify all environment variables set
4. Ensure all three servers running
5. Check browser console for errors

---

**Status**: [ ] Not Started [ ] In Progress [ ] Complete

**Date Completed**: ******\_\_\_******

**Setup Time**: ******\_\_\_****** minutes

**Notes**: ****************\_\_\_****************
