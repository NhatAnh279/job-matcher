import requests
from bs4 import BeautifulSoup

# Scrape using full user agent
def scrape_jora(query, location):
    url = f"https://au.jora.com/j?sp=search&trigger_source=serp&q={query}+{location}"
    headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
}
    try:
        response = requests.get(url, headers=headers)
    except requests.exceptions.RequestException as e:
        print(f"Request failed:{e}")
        return []

    # Error Handler
    if response.status_code == 200:
        print("Data retrieved successfully!")
    else:
        print(f"Failed to retrieve data {response.status_code}")
        return []
    
    soup = BeautifulSoup(response.text, "html.parser")

    # Loop through all cards to get return data
    job_cards = soup.find_all("div", class_="job-card")
    
    jobs = []
    # Return job info
    for card in job_cards:
        title = ""
        badge_list = []
        url = ""
        
        h2 = card.find("h2")
        if h2:
            a = h2.find("a")
            if a:
                title = a.text.strip()
                url = "https://au.jora.com" + a.get("href") 

# Company name        
        company = card.find("span", class_ = "job-company")

# Location
        location = card.find("a", class_ = "job-location")

# Employment type
        badges_div = card.find("div", class_ = "badges")
        if badges_div:
            badges = badges_div.find_all("div", class_ = "content")
            badge_list = [b.text.strip() for b in badges]

# Job posted date
        posted_date = card.find("span", class_ = "job-listed-date")

        job = {
            "title": title,
            "company": company.text.strip() if company else "",
            "location": location.text.strip() if location else "",
            "badges": badge_list,
            "posted_at": posted_date.text.strip() if posted_date else "",
            "url": url,
            
        }
        jobs.append(job)

    return jobs
 

jobs = scrape_jora("data analyst", "sydney")
print (jobs)


    