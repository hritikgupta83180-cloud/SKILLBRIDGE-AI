from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import pdfplumber
import io
import json
import sqlite3
from datetime import datetime

from database import init_db, get_db
from auth import hash_password, verify_password, create_token, get_current_user
from ai_engine import analyze_resume, get_mentor_response

load_dotenv()

app = FastAPI(title="SkillBridge API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

# ─── AUTH ─────────────────────────────────────────────────────────────────────

@app.post("/auth/register")
async def register(request: Request):
    data = await request.json()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not name or not email or not password:
        raise HTTPException(400, "All fields required")
    if len(password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    conn = get_db()
    try:
        conn.execute("INSERT INTO users (name, email, password) VALUES (?,?,?)",
                     (name, email, hash_password(password)))
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        token = create_token(user["user_id"], email)
        return {"token": token, "user": {"id": user["user_id"], "name": name, "email": email}}
    except sqlite3.IntegrityError:
        raise HTTPException(400, "Email already registered")
    finally:
        conn.close()

@app.post("/auth/login")
async def login(request: Request):
    data = await request.json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(user["user_id"], email)
    return {"token": token, "user": {"id": user["user_id"], "name": user["name"], "email": email}}

@app.get("/auth/me")
def me(current_user=Depends(get_current_user)):
    conn = get_db()
    user = conn.execute("SELECT user_id, name, email, created_at FROM users WHERE user_id=?",
                        (int(current_user["sub"]),)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(404, "User not found")
    return dict(user)

# ─── RESUME ───────────────────────────────────────────────────────────────────

@app.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    contents = await file.read()
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
    except Exception as e:
        raise HTTPException(400, f"PDF error: {str(e)}")
    if not text.strip():
        raise HTTPException(400, "Could not extract text from PDF.")
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO resumes (user_id, filename, parsed_text) VALUES (?,?,?)",
        (int(current_user["sub"]), file.filename, text.strip())
    )
    conn.commit()
    resume_id = cursor.lastrowid
    conn.close()
    return {"resume_id": resume_id, "filename": file.filename, "text_preview": text[:200]}

@app.get("/resume/list")
def list_resumes(current_user=Depends(get_current_user)):
    conn = get_db()
    resumes = conn.execute("SELECT resume_id, filename, upload_date FROM resumes WHERE user_id=? ORDER BY upload_date DESC",
                           (int(current_user["sub"]),)).fetchall()
    conn.close()
    return [dict(r) for r in resumes]

# ─── ROLES ────────────────────────────────────────────────────────────────────

@app.get("/roles")
def get_roles():
    return {"roles": [
        "AI Engineer", "Data Scientist", "Software Engineer",
        "Full Stack Developer", "Frontend Developer", "Backend Developer",
        "Cloud Engineer", "DevOps Engineer", "Cybersecurity Analyst",
        "Product Manager", "Machine Learning Engineer", "Android Developer",
        "iOS Developer", "Data Analyst", "Blockchain Developer", "UI/UX Designer"
    ]}

# ─── ANALYSIS ─────────────────────────────────────────────────────────────────

@app.post("/analyze")
async def analyze(request: Request, current_user=Depends(get_current_user)):
    data = await request.json()
    resume_id = data.get("resume_id")
    target_role = data.get("target_role", "")
    if not resume_id or not target_role:
        raise HTTPException(400, "resume_id and target_role required")
    conn = get_db()
    resume = conn.execute("SELECT * FROM resumes WHERE resume_id=? AND user_id=?",
                          (resume_id, int(current_user["sub"]))).fetchone()
    if not resume:
        raise HTTPException(404, "Resume not found")
    try:
        result = analyze_resume(resume["parsed_text"], target_role)
    except Exception as e:
        conn.close()
        raise HTTPException(500, f"AI Analysis failed: {str(e)}")
    cursor = conn.execute(
        "INSERT INTO analyses (user_id, resume_id, target_role, ats_score, readiness_score, skill_match, current_skills, missing_skills, matching_skills, report_json) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (int(current_user["sub"]), resume_id, target_role,
         result.get("ats_score", 0), result.get("readiness_score", 0),
         result.get("skill_match_percent", 0),
         json.dumps(result.get("current_skills", [])),
         json.dumps(result.get("missing_skills", [])),
         json.dumps(result.get("matching_skills", [])),
         json.dumps(result))
    )
    analysis_id = cursor.lastrowid
    roadmap = result.get("roadmap", [])
    for item in roadmap:
        conn.execute(
            "INSERT INTO roadmaps (analysis_id, user_id, skill_name, priority, duration, resources) VALUES (?,?,?,?,?,?)",
            (analysis_id, int(current_user["sub"]),
             item.get("title", ""), item.get("priority", "Medium"),
             item.get("duration", ""), json.dumps(item.get("courses", [])))
        )
    conn.commit()
    conn.close()
    return {"analysis_id": analysis_id, **result}

@app.get("/analysis/history")
def analysis_history(current_user=Depends(get_current_user)):
    conn = get_db()
    analyses = conn.execute(
        "SELECT analysis_id, target_role, ats_score, readiness_score, skill_match, created_at FROM analyses WHERE user_id=? ORDER BY created_at DESC",
        (int(current_user["sub"]),)).fetchall()
    conn.close()
    return [dict(a) for a in analyses]

@app.get("/analysis/{analysis_id}")
def get_analysis(analysis_id: int, current_user=Depends(get_current_user)):
    conn = get_db()
    analysis = conn.execute("SELECT * FROM analyses WHERE analysis_id=? AND user_id=?",
                            (analysis_id, int(current_user["sub"]))).fetchone()
    conn.close()
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    result = dict(analysis)
    result["report_json"] = json.loads(result["report_json"])
    return result

# ─── PROGRESS ─────────────────────────────────────────────────────────────────

@app.get("/roadmap/{analysis_id}")
def get_roadmap(analysis_id: int, current_user=Depends(get_current_user)):
    conn = get_db()
    roadmap = conn.execute(
        "SELECT r.*, p.completed FROM roadmaps r LEFT JOIN progress p ON r.roadmap_id=p.roadmap_id AND p.user_id=? WHERE r.analysis_id=? AND r.user_id=?",
        (int(current_user["sub"]), analysis_id, int(current_user["sub"]))).fetchall()
    conn.close()
    return [dict(r) for r in roadmap]

@app.post("/progress/update")
async def update_progress(request: Request, current_user=Depends(get_current_user)):
    data = await request.json()
    roadmap_id = data.get("roadmap_id")
    completed = data.get("completed", False)
    conn = get_db()
    existing = conn.execute("SELECT * FROM progress WHERE user_id=? AND roadmap_id=?",
                            (int(current_user["sub"]), roadmap_id)).fetchone()
    if existing:
        conn.execute("UPDATE progress SET completed=?, completed_at=? WHERE user_id=? AND roadmap_id=?",
                     (1 if completed else 0, datetime.utcnow() if completed else None,
                      int(current_user["sub"]), roadmap_id))
    else:
        conn.execute("INSERT INTO progress (user_id, roadmap_id, completed, completed_at) VALUES (?,?,?,?)",
                     (int(current_user["sub"]), roadmap_id, 1 if completed else 0,
                      datetime.utcnow() if completed else None))
    conn.commit()
    conn.close()
    return {"success": True}

# ─── AI MENTOR ────────────────────────────────────────────────────────────────

@app.post("/mentor/chat")
async def mentor_chat(request: Request, current_user=Depends(get_current_user)):
    data = await request.json()
    question = data.get("question", "")
    analysis_id = data.get("analysis_id")
    conn = get_db()
    analysis = conn.execute("SELECT * FROM analyses WHERE analysis_id=? AND user_id=?",
                            (analysis_id, int(current_user["sub"]))).fetchone()
    resume = None
    if analysis:
        resume = conn.execute("SELECT parsed_text FROM resumes WHERE resume_id=?",
                              (analysis["resume_id"],)).fetchone()
    conn.close()
    missing = json.loads(analysis["missing_skills"]) if analysis else []
    resume_text = resume["parsed_text"][:500] if resume else ""
    target_role = analysis["target_role"] if analysis else "Software Engineer"
    answer = get_mentor_response(question, resume_text, target_role, missing)
    return {"answer": answer}

# ─── DASHBOARD ────────────────────────────────────────────────────────────────

@app.get("/dashboard")
def dashboard(current_user=Depends(get_current_user)):
    conn = get_db()
    uid = int(current_user["sub"])
    latest = conn.execute(
        "SELECT * FROM analyses WHERE user_id=? ORDER BY created_at DESC LIMIT 1", (uid,)).fetchone()
    total_analyses = conn.execute("SELECT COUNT(*) as c FROM analyses WHERE user_id=?", (uid,)).fetchone()["c"]
    total_resumes = conn.execute("SELECT COUNT(*) as c FROM resumes WHERE user_id=?", (uid,)).fetchone()["c"]
    completed_skills = conn.execute(
        "SELECT COUNT(*) as c FROM progress WHERE user_id=? AND completed=1", (uid,)).fetchone()["c"]
    conn.close()
    if latest:
        return {
            "readiness_score": latest["readiness_score"],
            "ats_score": latest["ats_score"],
            "skill_match": latest["skill_match"],
            "missing_skills_count": len(json.loads(latest["missing_skills"])),
            "target_role": latest["target_role"],
            "total_analyses": total_analyses,
            "total_resumes": total_resumes,
            "completed_skills": completed_skills,
            "latest_analysis_id": latest["analysis_id"]
        }
    return {"readiness_score": 0, "ats_score": 0, "skill_match": 0,
            "missing_skills_count": 0, "total_analyses": 0, "total_resumes": total_resumes,
            "completed_skills": 0, "latest_analysis_id": None}

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0"}
