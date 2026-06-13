from openai import OpenAI
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY")
)

def clean_json(raw: str) -> str:
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0]
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0]
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start != -1 and end > start:
        raw = raw[start:end]
    raw = re.sub(r',\s*}', '}', raw)
    raw = re.sub(r',\s*]', ']', raw)
    raw = re.sub(r'(?<!\\)\n', ' ', raw)
    raw = raw.replace('\u2018', "'").replace('\u2019', "'")
    raw = raw.replace('\u201c', '"').replace('\u201d', '"')
    return raw.strip()


def analyze_resume(resume_text: str, target_role: str) -> dict:
    prompt = f"""You are an expert career coach and ATS expert.
Analyze this resume for the target role. Return ONLY valid JSON with NO markdown, NO explanation, NO extra text.
Start your response with {{ and end with }}

Resume:
{resume_text[:3000]}

Target Role: {target_role}

Return EXACTLY this JSON (fill all fields with real data):
{{
  "candidate_name": "extracted name or Unknown",
  "candidate_email": "extracted email or empty string",
  "candidate_phone": "extracted phone or empty string",
  "current_skills": ["skill1", "skill2", "skill3"],
  "required_skills": ["skill1", "skill2", "skill3"],
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "weak_skills": ["skill1"],
  "readiness_score": 65,
  "ats_score": 72,
  "skill_match_percent": 60,
  "ats_issues": ["Issue 1", "Issue 2"],
  "ats_suggestions": ["Add more keywords", "Use action verbs"],
  "strengths": ["strength1", "strength2"],
  "summary": "2-3 sentence personalized career analysis here",
  "roadmap": [
    {{
      "month": 1,
      "title": "Foundation Skills",
      "skills": ["skill1", "skill2"],
      "duration": "4 weeks",
      "priority": "High",
      "difficulty": "Beginner",
      "milestone": "What you can do after this month",
      "courses": [
        {{
          "name": "Course name here",
          "provider": "Coursera",
          "url": "https://coursera.org",
          "duration": "20 hours",
          "rating": 4.5,
          "cost": "Free"
        }}
      ]
    }},
    {{
      "month": 2,
      "title": "Core Skills",
      "skills": ["skill3", "skill4"],
      "duration": "4 weeks",
      "priority": "High",
      "difficulty": "Intermediate",
      "milestone": "What you can do after this month",
      "courses": [
        {{
          "name": "Course name here",
          "provider": "YouTube",
          "url": "https://youtube.com",
          "duration": "15 hours",
          "rating": 4.3,
          "cost": "Free"
        }}
      ]
    }}
  ],
  "total_months": 3,
  "interview_questions": {{
    "technical": ["Question 1?", "Question 2?", "Question 3?"],
    "hr": ["Tell me about yourself?", "Why this role?"],
    "behavioral": ["Describe a challenge you faced?", "Team conflict example?"],
    "coding": ["Write a function to reverse a string", "Explain time complexity"]
  }},
  "salary_prediction": {{
    "fresher": "3-5 LPA",
    "mid_level": "8-12 LPA",
    "senior": "18-25 LPA",
    "location": "India"
  }}
}}"""

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[
                {
                    "role": "system",
                    "content": "You are a JSON generator. You ONLY output valid JSON. Never add any text before or after the JSON object."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=4096
        )
        raw = response.choices[0].message.content.strip()
        cleaned = clean_json(raw)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Raw response (first 500 chars): {raw[:500]}")
            return get_fallback_response(target_role)
    except Exception as e:
        print(f"API Error: {e}")
        return get_fallback_response(target_role)


def get_fallback_response(target_role: str) -> dict:
    return {
        "candidate_name": "Unknown",
        "candidate_email": "",
        "candidate_phone": "",
        "current_skills": ["Skills detected from resume"],
        "required_skills": ["Python", "Problem Solving", "Communication"],
        "matching_skills": [],
        "missing_skills": ["Role-specific skills needed"],
        "weak_skills": [],
        "readiness_score": 40,
        "ats_score": 50,
        "skill_match_percent": 40,
        "ats_issues": ["Could not fully analyze — please try again"],
        "ats_suggestions": ["Ensure resume has clear sections", "Add technical skills explicitly"],
        "strengths": ["Resume submitted successfully"],
        "summary": f"Analysis for {target_role} role. Please try re-uploading for detailed analysis.",
        "roadmap": [
            {
                "month": 1,
                "title": "Core Foundation",
                "skills": ["Python", "Data Structures"],
                "duration": "4 weeks",
                "priority": "High",
                "difficulty": "Beginner",
                "milestone": "Build foundational skills for the role",
                "courses": [
                    {
                        "name": "Python for Beginners",
                        "provider": "Coursera",
                        "url": "https://coursera.org",
                        "duration": "20 hours",
                        "rating": 4.5,
                        "cost": "Free"
                    }
                ]
            }
        ],
        "total_months": 3,
        "interview_questions": {
            "technical": ["Explain your most challenging project?", "What is OOP?", "Explain REST APIs"],
            "hr": ["Tell me about yourself?", "Why do you want this role?"],
            "behavioral": ["Describe a challenge you overcame?", "How do you handle pressure?"],
            "coding": ["Reverse a string", "Find duplicates in an array"]
        },
        "salary_prediction": {
            "fresher": "3-5 LPA",
            "mid_level": "8-12 LPA",
            "senior": "18-25 LPA",
            "location": "India"
        }
    }


def get_mentor_response(question: str, resume_text: str, target_role: str, missing_skills: list) -> str:
    prompt = f"""You are SkillBridge AI Career Mentor — an expert career coach.

Student Profile:
- Target Role: {target_role}
- Missing Skills: {', '.join(missing_skills[:6])}
- Resume Summary: {resume_text[:400]}

Question: {question}

IMPORTANT — Reply in this EXACT structured format:

## 🎯 [Write a relevant heading here]
[1-2 line direct answer]

## 📚 [Section heading]
1. **Point** — explanation
2. **Point** — explanation
3. **Point** — explanation

## 🛠️ [Section heading]
- **Item** — explanation
- **Item** — explanation
- **Item** — explanation

## ⏱️ Suggested Timeline
- **Short term (1-2 months):** [what to do]
- **Mid term (3-4 months):** [what to do]
- **Long term (5-6 months):** [what to do]

## 💡 Pro Tip
[One specific actionable tip for this student]

> 🚀 [One motivational closing line]"""

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[
                {
                    "role": "system",
                    "content": """You are SkillBridge AI Career Mentor.
STRICT RULES:
1. ALWAYS use markdown formatting — ## headings, **bold**, numbered lists, bullet points
2. ALWAYS add emojis to every section heading
3. NEVER write plain paragraphs — always use structured format
4. Give specific advice based on the student's target role and missing skills
5. Keep each section concise and scannable
6. End EVERY response with a > blockquote motivational line"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1024
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Mentor API Error: {e}")
        return f"""## 🎯 Career Guidance for {target_role}

Here's your personalized action plan!

## 📚 Immediate Next Steps
1. **Master missing skills** — Focus on: {', '.join(missing_skills[:3]) if missing_skills else 'core technical skills'}
2. **Build real projects** — Apply each skill in a hands-on project
3. **Practice daily** — Even 1-2 hours consistently beats weekend cramming

## 🛠️ Best Free Resources
- **YouTube** — Free tutorials for any technology
- **Coursera / NPTEL** — Structured free certified courses
- **LeetCode** — Daily coding practice
- **GitHub** — Host all projects publicly for portfolio

## ⏱️ Suggested Timeline
- **Short term (1-2 months):** Master 2-3 core missing skills
- **Mid term (3-4 months):** Build 2 full projects using those skills
- **Long term (5-6 months):** Apply for jobs and prep for interviews

## 💡 Pro Tip
**Start small, stay consistent.** Learn one skill completely before moving to the next.

> 🚀 Every expert was once a beginner — your journey to {target_role} starts today!"""


# ─── SKILL GAP TIME MACHINE ───────────────────────────────────────────────────

def get_skill_gap_timeline(skills_data: dict) -> str:
    skills_text = "\n".join([f"{skill}: {level}/10" for skill, level in skills_data.items()])
    prompt = f"""You are SkillBridge AI Career Mentor.

Student's current skill levels (0=none, 10=expert):
{skills_text}

For each skill below 7, give analysis in this EXACT format:

## ⏳ Skill Gap Timeline

### [Skill Name] — Current: X/10
- **Weeks to proficiency:** X weeks
- **Best resource type:** Video/Book/Project
- **This week's action:** One specific task to do this week

(repeat for each weak skill)

## 💡 Pro Tip
[One actionable tip to learn faster]

> 🚀 [One motivational closing line]"""

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[
                {
                    "role": "system",
                    "content": "You are SkillBridge AI Career Mentor. Always use markdown formatting with emojis. Be specific and actionable."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1024
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Skill Gap API Error: {e}")
        return "## ⏳ Skill Gap Analysis\n\nUnable to analyze right now. Please try again.\n\n> 🚀 Keep pushing forward!"


# ─── RECRUITER SIMULATOR ──────────────────────────────────────────────────────

def get_recruiter_question(role: str) -> str:
    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[
                {
                    "role": "system",
                    "content": "You are a tough but fair recruiter. Ask ONE realistic interview question. Just the question, nothing else. No numbering, no preamble, no explanation."
                },
                {
                    "role": "user",
                    "content": f"Ask one interview question for a {role} role candidate."
                }
            ],
            temperature=0.9,
            max_tokens=100
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Recruiter Question Error: {e}")
        return f"Tell me about a challenging project you worked on relevant to {role}?"


def get_recruiter_feedback(role: str, question: str, answer: str) -> str:
    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[
                {
                    "role": "system",
                    "content": "You are a strict but fair recruiter giving interview feedback. Be concise, honest and specific."
                },
                {
                    "role": "user",
                    "content": f"""Role: {role}
Question: {question}
Candidate Answer: {answer}

Give feedback in EXACTLY this format:

## ⭐ Score: X/10

## ✅ What Was Good
- [specific point 1]
- [specific point 2]

## 🔧 What To Improve
- [specific point 1]
- [specific point 2]

## 💬 Ideal Answer Hint
[One sentence hint on what a perfect answer looks like]"""
                }
            ],
            temperature=0.5,
            max_tokens=400
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Recruiter Feedback Error: {e}")
        return "## ⭐ Score: 6/10\n\n## ✅ What Was Good\n• You attempted the question.\n• Some relevant points mentioned.\n\n## 🔧 What To Improve\n• Be more specific with real examples.\n• Use the STAR method.\n\n## 💬 Ideal Answer Hint\nUse Situation, Task, Action, Result format for best impact."


# ─── COMPETITION RADAR ────────────────────────────────────────────────────────

def get_competition_radar(field: str, level: str) -> dict:
    prompt = f"""For {level} {field} job market in 2025, return ONLY a JSON object. No markdown, no extra text, start directly with {{

{{
  "trending_skills": [
    {{"skill": "Python", "demand": 92, "growth": "+15%"}},
    {{"skill": "Machine Learning", "demand": 85, "growth": "+20%"}},
    {{"skill": "SQL", "demand": 80, "growth": "+8%"}},
    {{"skill": "Deep Learning", "demand": 75, "growth": "+25%"}},
    {{"skill": "Cloud (AWS)", "demand": 70, "growth": "+18%"}}
  ],
  "competitor_profile": {{
    "avg_skills": 6,
    "top_certifications": ["Google Data Analytics", "AWS Cloud Practitioner"],
    "avg_projects": 3
  }},
  "gap_alerts": [
    "Most candidates lack MLOps knowledge",
    "Cloud skills becoming mandatory",
    "Portfolio projects are key differentiator"
  ],
  "edge_skills": ["MLOps", "LLM Fine-tuning", "Spark"]
}}

Fill with REAL accurate data for {level} {field}. Return only JSON."""

    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[
                {
                    "role": "system",
                    "content": "You are a JSON generator. Output ONLY valid JSON. No markdown, no text before or after the JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=600
        )
        raw = response.choices[0].message.content.strip()
        cleaned = clean_json(raw)
        return json.loads(cleaned)
    except Exception as e:
        print(f"Competition Radar Error: {e}")
        return {
            "trending_skills": [
                {"skill": "Python", "demand": 90, "growth": "+15%"},
                {"skill": "Machine Learning", "demand": 82, "growth": "+20%"},
                {"skill": "SQL", "demand": 78, "growth": "+8%"},
                {"skill": "Deep Learning", "demand": 72, "growth": "+25%"},
                {"skill": "Cloud (AWS)", "demand": 68, "growth": "+18%"}
            ],
            "competitor_profile": {
                "avg_skills": 6,
                "top_certifications": ["Google Data Analytics", "AWS Cloud Practitioner"],
                "avg_projects": 3
            },
            "gap_alerts": [
                "Most candidates lack MLOps knowledge",
                "Cloud skills becoming mandatory",
                "Portfolio projects are key differentiator"
            ],
            "edge_skills": ["MLOps", "LLM Fine-tuning", "Apache Spark"]
        }