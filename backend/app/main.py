
import json
from fastapi import FastAPI, UploadFile, File, Form
import tempfile
import os
from app.ml.resume_parser import extract_text_from_pdf
from app.ml.matcher import calculate_match
from app.api.auth import register_user, login_user
from app.api.auth import supabase


app = FastAPI()

@app.get("/")
def root():
    return {"message": "Job Matcher API is running!"}

@app.get("/api/jobs")
def get_jobs(q: str = "", location: str = "", source: str = "all"):
    with open("app/data/jobs.json", "r") as f:
        jobs = json.load(f)
    
    # Keyword filtering
    if q:
        filtered_jobs = []
        for j in jobs:
            if q.lower() in j["title"].lower():
                filtered_jobs.append(j)
        jobs = filtered_jobs 
    
    # Location filtering    
    if location:
        filtered_locations = []
        for j in jobs:
            if location.lower() in j["location"].lower():
                filtered_locations.append(j)
        jobs = filtered_locations
        
    return {"jobs": jobs, "total": len(jobs)}
        
@app.post("/api/match")
def match_resume(resume: UploadFile = File(...), job_url: str = Form(...), token: str = Form(...)):
    
    # User authentication
    user = supabase.auth.get_user(token)
    user_id = user.user.id
    
    # Parse text from resume
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.write(resume.file.read())
    temp_file.close()
    
    resume_text = extract_text_from_pdf(temp_file.name)
    
    os.remove(temp_file.name)
    
    # Load job data
    with open("app/data/jobs.json", "r") as f:
        jobs = json.load(f)
        
    job = None
    for j in jobs:
        if j["url"] == job_url:
            job = j
            break
        
    if not job:
        return {"error": "Job not found"}
        
    result = calculate_match(resume_text, job["description"])
    supabase.table("match_history").insert({
    "user_id": user_id,
    "job_title": job["title"],
    "company": job["company"],
    "score": result["score"],
    "matched_skills": str(result["matched_skills"]),
    "missing_skills": str(result["missing_skills"]),
}).execute()
    return result
        
@app.post("/api/auth/register")
def register(email: str = Form(...), password: str = Form(...)):
    try:
        response = register_user(email, password)
        return response
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/auth/login")
def login(email: str = Form(...), password: str = Form(...)):
    try:
        response = login_user(email, password)
        return {"user_id": response.user.id, "token": response.session.access_token}
    except Exception as e:
        return {"error": str(e)}
        
    
            

