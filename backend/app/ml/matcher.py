from unittest import result

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from app.ml.extractor import extract_skills


# Load the pre-trained SBERT model
model = SentenceTransformer('all-MiniLM-L6-v2')


def match_resume(resume_text, jd_text):
    embeddings = model.encode([jd_text, resume_text])
    similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return round(similarity * 100, 2)

def calculate_match(resume_text, jd_text):
    # Extract skills from both resume and JD
    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(jd_text)
    
    # Calculate match percentage
    matched = []
    for skill in jd_skills:
        if skill in resume_skills:
            matched.append(skill)
    keyword_match_score = (len(matched) / len(jd_skills) if jd_skills else 0)
    
    # Calculate similarity score using SBERT
    similarity_score = match_resume(resume_text, jd_text) / 100
    
    # Combine both scores
    final_score = keyword_match_score * 0.4 + similarity_score * 0.6
    
    # Missing Skills
    missing_skills = []
    for skill in jd_skills:
        if skill not in resume_skills:
            missing_skills.append(skill)
    
    return {
        "score": round(float(final_score) * 100, 2),
        "matched_skills": matched,
        "missing_skills": missing_skills
    }
    
    
def get_shap_scores(resume_text, jd_text):
    result = calculate_match(resume_text, jd_text)
    base_score = result["score"]
    matched_skills = result["matched_skills"]
    missing_skills = result["missing_skills"]
    shap_scores = {}
    
    for skill in matched_skills:
        modified_resume = resume_text.replace(skill, "")
        modified_result = calculate_match(modified_resume, jd_text)["score"]
        contribution = base_score - modified_result
        shap_scores[skill] = round(contribution, 2)
        
    for skill in missing_skills:
        modified_resume = resume_text + " " + skill
        modified_result = calculate_match(modified_resume, jd_text)["score"]
        contribution = modified_result - base_score
        shap_scores[skill] = round(contribution, 2)
    
    return shap_scores