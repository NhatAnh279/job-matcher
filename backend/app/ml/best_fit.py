from sklearn.cluster import KMeans
from sentence_transformers import SentenceTransformer
import json
model = SentenceTransformer('all-MiniLM-L6-v2')

def build_clusters():
    with open("app/data/jobs.json", "r") as f:
        jobs = json.load(f)
        
    
    embeddings = model.encode([job["description"] for job in jobs])
    
    # KMeans clustering
    kmeans = KMeans(n_clusters=5, random_state=42)
    kmeans.fit(embeddings)
    
    labels = kmeans.labels_
    clusters = {}
    for i, job in enumerate(jobs):
        label = labels[i]
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(job)
        
    role_names = {}
    for label, cluster_jobs in clusters.items():
        # Đếm titles trong cluster này
        title_count = {}                          # reset mỗi cluster
        for job in cluster_jobs:
            title = job["title"]
            if title not in title_count:
                title_count[title] = 0
            title_count[title] += 1
        
        # Tìm title nhiều nhất
        most_common = max(title_count, key=title_count.get)
        role_names[label] = most_common
    
    return kmeans, role_names

kmeans, role_names = build_clusters()        

def get_best_fit(resume_text):
    embeddings = model.encode([resume_text])
    
    ranked_roles = []
    # Calculate distance to each cluster center
    distances = kmeans.transform(embeddings)
    max_dist = max(distances[0])  
    for i, distance in enumerate(distances[0]):
        fit = round(float(1 - distance / max_dist) * 100, 1)
        ranked_roles.append({"title": role_names[i], "fit": fit})
    ranked_roles.sort(key=lambda x: x["fit"], reverse=True)
    
    return ranked_roles
    
    

            
                
            
                

    
    