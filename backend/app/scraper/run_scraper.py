import json
from jora import scrape_jora
from seek import scrape_seek

jora_jobs = scrape_jora("data analyst", "sydney", 1)
seek_jobs = scrape_seek("data analyst", "Sydney-NSW-2000", 1)

all_jobs = jora_jobs + seek_jobs

with open("../data/jobs.json", "w") as f:
    json.dump(all_jobs, f)

print(f"Saved {len(all_jobs)} jobs ({len(jora_jobs)} Jora + {len(seek_jobs)} Seek)")