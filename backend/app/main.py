from fastapi import FastAPI
import json

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
        

            

