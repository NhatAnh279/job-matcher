import json
from jora import scrape_jora
from seek import scrape_seek

all_jobs = []

queries = [
    "software engineer", "data scientist", "data analyst",
    "data engineer", "ml engineer", "devops engineer",
    "frontend developer", "backend developer",
    "business analyst", "project manager",
    "business intelligence", "financial analyst",
    "risk analyst", "registered nurse",
    "mechanical engineer", "civil engineer",
    "marketing analyst", "digital marketing",
    "hr coordinator", "recruiter",
    "retail manager", "sales analyst",
    "hotel manager", "chef",
    "paralegal", "legal assistant",
    "teacher", "lecturer",
    "site manager", "quantity surveyor",
    "supply chain analyst", "logistics coordinator",
    "research scientist", "lab technician",
]

for query in queries:
    jora_jobs = scrape_jora(query, "sydney", 1)
    all_jobs += jora_jobs
    print(f"Jora '{query}': {len(jora_jobs)} jobs")

seek_queries = [
    "data-analyst", "software-engineer",
    "data-scientist", "business-analyst",
]

for query in seek_queries:
    seek_jobs = scrape_seek(query, "Sydney-NSW-2000", 1)
    all_jobs += seek_jobs
    print(f"Seek '{query}': {len(seek_jobs)} jobs")

with open("../data/jobs.json", "w") as f:
    json.dump(all_jobs, f)

print(f"\nTotal: {len(all_jobs)} jobs")