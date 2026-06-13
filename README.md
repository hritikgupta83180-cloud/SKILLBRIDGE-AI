# SkillBridge v2.0 — AI Skill Gap Analyzer
### From Resume to Dream Role 🚀

---

## Features
- ✅ Login & Registration (JWT Auth)
- ✅ Resume Upload (PDF)
- ✅ AI Resume Analysis (Gemini)
- ✅ Skill Gap Detection
- ✅ ATS Score & Optimization
- ✅ Personalized Learning Roadmap
- ✅ Course Recommendations
- ✅ AI Career Mentor (Chatbot)
- ✅ Progress Tracking
- ✅ Salary Prediction
- ✅ Interview Questions

---

## Setup

### GET NVDIA API KEY
1. Go to https://NVDIA.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Add to .env
Open `backend/.env` and add your key:
```
GEMINI_API_KEY=your_key_here
JWT_SECRET=skillbridge_secret_2026
```

### Install Backend
```bash
cd backend
pip install -r requirements.txt
```

### Install Frontend
```bash
cd frontend
npm install
```

---

## Run

### Terminal 1 — Backend
```bash
cd backend
uvicorn main:app --reload
```
Runs on: http://localhost:8000

### Terminal 2 — Frontend
```bash
cd frontend
npm run dev
```
Runs on: http://localhost:5173

---

## Tech Stack
- Frontend: React 18, Vite, Lucide Icons
- Backend: FastAPI, Python
- AI: Google Gemini 1.5 Flash (FREE)
- Database: SQLite (no setup needed)
- Auth: JWT

---

## Team: SKILLBRIDGER | CPL 2026
