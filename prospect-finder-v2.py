"""
AUTOMATED PROSPECT FINDER v2
Searches Google Maps for local service businesses, checks website quality,
and saves qualified leads to a local JSON file that feeds your dashboard.

NO Google Sheets needed. Just your Google Maps API key.

SETUP:
1. pip3 install googlemaps requests beautifulsoup4
2. Create .env file with your Google Maps API key
3. python3 prospect-finder.py
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
import time
import re
import os
import random

# ══════════════════════════════════════════════
# LOAD .env FILE
# ══════════════════════════════════════════════

def load_env(filepath=".env"):
    try:
        with open(filepath) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip()
        print("✅ Loaded .env file")
    except FileNotFoundError:
        print("⚠️  No .env file found, using environment variables")

load_env()

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")
DATA_FILE = "prospects.json"

if not GOOGLE_MAPS_API_KEY:
    print("❌ ERROR: No Google Maps API key found.")
    print("   Add it to your .env file: GOOGLE_MAPS_API_KEY=your_key_here")
    exit(1)

# ══════════════════════════════════════════════
# CITIES & INDUSTRIES
# ══════════════════════════════════════════════

CITIES = [
    "Frisco, TX",
    "Plano, TX",
    "McKinney, TX",
    "The Colony, TX",
    "Allen, TX",
    "Prosper, TX",
    "Celina, TX",
    "Little Elm, TX",
    "Denton, TX",
    "Lewisville, TX",
    "Flower Mound, TX",
    "Carrollton, TX",
    "Richardson, TX",
    "Garland, TX",
    "Mesquite, TX",
    "Rowlett, TX",
    "Wylie, TX",
    "Sachse, TX",
    "Murphy, TX",
    "Forney, TX",
]

INDUSTRIES = [
    "roofing company",
    "HVAC company",
    "fence company",
    "plumbing company",
    "landscaping company",
    "garage door company",
    "auto detailing",
    "med spa",
    "dentist",
    "pest control",
    "concrete company",
    "pool builder",
    "painting company",
    "electrical contractor",
    "tree service",
    "pressure washing",
    "flooring company",
    "window cleaning",
    "moving company",
    "junk removal",
]

INDUSTRY_MAP = {
    "roofing company": "Roofing",
    "hvac company": "HVAC",
    "fence company": "Fencing",
    "plumbing company": "Plumbing",
    "landscaping company": "Landscaping",
    "garage door company": "Garage Doors",
    "auto detailing": "Auto Detailing",
    "med spa": "Med Spa",
    "dentist": "Dentist",
    "pest control": "Pest Control",
    "concrete company": "Concrete",
    "pool builder": "Pool Builder",
    "painting company": "Painting",
    "electrical contractor": "Electrical",
    "tree service": "Tree Service",
    "pressure washing": "Pressure Washing",
    "flooring company": "Flooring",
    "window cleaning": "Window Cleaning",
    "moving company": "Moving",
    "junk removal": "Junk Removal",
}

CITIES_PER_RUN = 3
INDUSTRIES_PER_RUN = 5
MIN_RATING = 3.5
MAX_RESULTS_PER_QUERY = 10

# ══════════════════════════════════════════════
# LOCAL JSON DATABASE
# ══════════════════════════════════════════════

def load_prospects():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return []

def save_prospects(prospects):
    with open(DATA_FILE, "w") as f:
        json.dump(prospects, f, indent=2)
    print(f"💾 Saved {len(prospects)} prospects to {DATA_FILE}")

def get_existing_names(prospects):
    return set(p["name"].strip().lower() for p in prospects)

# ══════════════════════════════════════════════
# WEBSITE QUALITY CHECKER
# ══════════════════════════════════════════════

def check_website_quality(url):
    if not url or url.strip() == "":
        return "No Website", ["No website found"]

    url = url.strip()
    if not url.startswith("http"):
        url = "https://" + url

    issues = []
    score = 100

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        }
        response = requests.get(url, timeout=10, headers=headers, allow_redirects=True)

        if response.status_code != 200:
            return "Terrible", [f"Site returns {response.status_code} error"]

        html = response.text
        soup = BeautifulSoup(html, "html.parser")

        if len(html) < 2000:
            issues.append("Extremely thin content")
            score -= 30

        if not soup.find("meta", attrs={"name": "viewport"}):
            issues.append("No mobile viewport tag")
            score -= 25

        title = soup.find("title")
        if not title or not title.string or len(title.string.strip()) < 5:
            issues.append("Missing or empty page title")
            score -= 15

        if not soup.find("meta", attrs={"name": "description"}):
            issues.append("No meta description")
            score -= 10

        if not soup.find("h1"):
            issues.append("No H1 heading")
            score -= 10

        forms = soup.find_all("form")
        has_form = len(forms) > 0
        if not has_form:
            form_indicators = ["typeform", "jotform", "tally", "formspree", "hubspot", "calendly"]
            has_form = any(ind in html.lower() for ind in form_indicators)
        if not has_form:
            issues.append("No lead capture form found")
            score -= 20

        phone_pattern = r'[\(]?\d{3}[\)]?[\s\-\.]?\d{3}[\s\-\.]?\d{4}'
        if not re.search(phone_pattern, html):
            issues.append("No visible phone number")
            score -= 10

        if not response.url.startswith("https"):
            issues.append("No SSL/HTTPS")
            score -= 15

        builders = {
            "wix.com": "Built on Wix",
            "squarespace.com": "Built on Squarespace",
            "weebly.com": "Built on Weebly",
            "godaddy.com": "GoDaddy builder",
        }
        for indicator, label in builders.items():
            if indicator in html.lower() or indicator in response.url.lower():
                issues.append(label)
                score -= 5
                break

        if any(f"copyright 20{yr}" in html.lower() for yr in ["18", "19", "20", "21"]):
            issues.append("Copyright date is years old")
            score -= 10

        if score >= 80: return "Good", issues
        elif score >= 60: return "Decent", issues
        elif score >= 35: return "Outdated", issues
        else: return "Terrible", issues

    except requests.exceptions.Timeout:
        return "Terrible", ["Site timed out (>10s load time)"]
    except requests.exceptions.ConnectionError:
        return "Terrible", ["Site failed to load"]
    except Exception as e:
        return "Terrible", [f"Error: {str(e)[:80]}"]

# ══════════════════════════════════════════════
# GOOGLE MAPS SEARCH (using Places API directly)
# ══════════════════════════════════════════════

def search_google_maps(query, location):
    results = []
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": f"{query} in {location}",
        "key": GOOGLE_MAPS_API_KEY,
        "type": "establishment"
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        data = resp.json()

        if data.get("status") != "OK":
            print(f"     ⚠️  API status: {data.get('status')}")
            if data.get("error_message"):
                print(f"     Error: {data['error_message']}")
            return results

        for place in data.get("results", [])[:MAX_RESULTS_PER_QUERY]:
            place_id = place.get("place_id")
            rating = place.get("rating", 0)

            if rating < MIN_RATING:
                continue

            # Get details for phone and website
            detail_url = "https://maps.googleapis.com/maps/api/place/details/json"
            detail_params = {
                "place_id": place_id,
                "fields": "name,formatted_phone_number,website,formatted_address,rating,user_ratings_total,business_status",
                "key": GOOGLE_MAPS_API_KEY
            }

            try:
                detail_resp = requests.get(detail_url, params=detail_params, timeout=10)
                detail = detail_resp.json().get("result", {})

                if detail.get("business_status") == "CLOSED_PERMANENTLY":
                    continue

                biz = {
                    "name": detail.get("name", ""),
                    "phone": detail.get("formatted_phone_number", ""),
                    "website": detail.get("website", ""),
                    "address": detail.get("formatted_address", ""),
                    "rating": str(detail.get("rating", "")),
                    "reviewCount": detail.get("user_ratings_total", 0),
                    "placeId": place_id,
                }
                results.append(biz)
                time.sleep(0.3)

            except Exception as e:
                print(f"     Error getting details: {e}")
                continue

    except Exception as e:
        print(f"     Search error: {e}")

    return results

# ══════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════

def run():
    print(f"\n{'='*60}")
    print(f"PROSPECT FINDER v2 — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*60}\n")

    # Load existing prospects
    prospects = load_prospects()
    existing = get_existing_names(prospects)
    print(f"📂 {len(prospects)} existing prospects in database.\n")

    # Pick random cities and industries
    today_cities = random.sample(CITIES, min(CITIES_PER_RUN, len(CITIES)))
    today_industries = random.sample(INDUSTRIES, min(INDUSTRIES_PER_RUN, len(INDUSTRIES)))

    total_found = 0
    total_added = 0
    total_skipped_dup = 0
    total_skipped_good = 0

    for city in today_cities:
        print(f"\n📍 Searching: {city}")
        print(f"{'—'*40}")

        for industry_query in today_industries:
            industry_label = INDUSTRY_MAP.get(industry_query, industry_query.title())
            print(f"\n  🔍 {industry_label} in {city}...")

            businesses = search_google_maps(industry_query, city)
            print(f"     Found {len(businesses)} businesses")

            for biz in businesses:
                total_found += 1

                if biz["name"].strip().lower() in existing:
                    total_skipped_dup += 1
                    continue

                quality, issues = check_website_quality(biz["website"])

                if quality in ["No Website", "Terrible", "Outdated"]:
                    city_short = city.split(",")[0].strip()

                    prospect = {
                        "id": f"p_{int(time.time()*1000)}_{random.randint(100,999)}",
                        "name": biz["name"],
                        "owner": "",
                        "industry": industry_label,
                        "city": city_short,
                        "phone": biz["phone"],
                        "email": "",
                        "website": biz["website"],
                        "quality": quality,
                        "rating": biz["rating"],
                        "source": "Google Maps Bot",
                        "status": "New Lead",
                        "lastContact": "",
                        "nextFollowUp": "",
                        "channel": "",
                        "notes": "; ".join(issues) if issues else "",
                        "package": "",
                        "value": "",
                        "dateAdded": datetime.now().strftime("%m/%d/%Y"),
                    }

                    prospects.append(prospect)
                    existing.add(biz["name"].strip().lower())
                    total_added += 1

                    print(f"     ✅ ADDING: {biz['name']} | {quality} | {biz['rating']}★")
                    if issues:
                        print(f"        Issues: {', '.join(issues[:3])}")
                else:
                    total_skipped_good += 1
                    print(f"     ⏭️  SKIP: {biz['name']} | {quality} (site is fine)")

            time.sleep(2)

    # Save everything
    save_prospects(prospects)

    # Summary
    print(f"\n\n{'='*60}")
    print(f"DAILY SUMMARY")
    print(f"{'='*60}")
    print(f"  Cities searched:      {len(today_cities)}")
    print(f"  Industries searched:  {len(today_industries)}")
    print(f"  Total businesses:     {total_found}")
    print(f"  Duplicates skipped:   {total_skipped_dup}")
    print(f"  Good sites skipped:   {total_skipped_good}")
    print(f"  NEW PROSPECTS ADDED:  {total_added}")
    print(f"  TOTAL IN DATABASE:    {len(prospects)}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    run()
