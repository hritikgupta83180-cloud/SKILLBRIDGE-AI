import sqlite3
import os

DB_PATH = "skillbridge.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        verified INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS resumes (
        resume_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        filename TEXT,
        parsed_text TEXT,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS analyses (
        analysis_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        resume_id INTEGER,
        target_role TEXT,
        ats_score INTEGER,
        readiness_score INTEGER,
        skill_match INTEGER,
        current_skills TEXT,
        missing_skills TEXT,
        matching_skills TEXT,
        report_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS roadmaps (
        roadmap_id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id INTEGER,
        user_id INTEGER,
        skill_name TEXT,
        priority TEXT,
        duration TEXT,
        status TEXT DEFAULT 'pending',
        resources TEXT,
        FOREIGN KEY (analysis_id) REFERENCES analyses(analysis_id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS progress (
        progress_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        roadmap_id INTEGER,
        completed INTEGER DEFAULT 0,
        completed_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )''')

    conn.commit()
    conn.close()
    print("Database initialized!")
