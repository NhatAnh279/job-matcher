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
    
    # Return job info
    for card in job_cards:
        h2 = card.find("h2")
        if h2:
            a = h2.find("a")
            if a:
                print(a.text.strip())

# Company name        
        company = card.find("span", class_ = "job-company")
        if company:
            print (company.text.strip())

# Location
        location = card.find("a", class_ = "job-location")
        if location:
            print (location.text.strip())

# Employment type
        badges_div = card.find("div", class_ = "badges")
        if badges_div:
            badges = badges_div.find_all("div", class_ = "content")
            badge_list = [b.text.strip() for b in badges]
            print(badge_list)

        

        

scrape_jora("data analyst", "sydney")


    