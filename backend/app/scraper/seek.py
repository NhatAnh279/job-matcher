from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import time

def scrape_seek(query, location, pages=3):
    query = query.replace(" ", "-")
    jobs = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Get URL from listings 
        job_urls = []
        for page_num in range(1, pages + 1):
            url = f"https://au.seek.com/{query}-jobs/in-{location}?page={page_num}"
            page.goto(url)
            page.wait_for_load_state("networkidle")
            
            links = page.query_selector_all('[data-automation="job-list-view-job-link"]')
            for link in links:
                href = link.get_attribute("href")
                if href:
                    job_urls.append("https://au.seek.com" + href)
        
        # Get data from job pages
        for job_url in job_urls:
            page.goto(job_url)
            page.wait_for_load_state("networkidle")
            html = page.content()
            soup = BeautifulSoup(html, "html.parser")
            
            
            # Extract job details
            title_el = soup.find(attrs={"data-automation": "job-detail-title"})
            location_el = soup.find(attrs={"data-automation": "job-detail-location"})
            company_el = soup.find(attrs={"data-automation": "advertiser-name"})
            description_el = soup.find(attrs={"data-automation": "jobAdDetails"})
            
            job_data = {
                "title": title_el.get_text(strip=True) if title_el else "",
                "company": company_el.get_text(strip=True) if company_el else "",
                "location": location_el.get_text(strip=True) if location_el else "",
                "description": description_el.get_text(strip=True) if description_el else "",
                "url": job_url,
                "source": "seek"
            }
            
            jobs.append(job_data)
            print(f"{job_data['title']} | {job_data['company']}")
            time.sleep(1)
        
        browser.close()
    return jobs

