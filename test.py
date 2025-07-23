import curl_cffi
import requests
import time
 
session = curl_cffi.Session(impersonate="chrome133a")
 
# DONE: your api key
api_key = "CAP-D2207C49885985C8FBCA86C5FFBC8D728FA2BC3DA753061B952F2A84C8B3AA2E"
#DONE: your target website url
website_url = "https://driverpracticaltest.dvsa.gov.uk/login"
# Local proxy configuration
LOCAL_PROXY = {
    "http": "http://127.0.0.1:1080",
    "https": "http://127.0.0.1:1080"
}


def view_website(cookies=None, max_retries=3):
    headers = {
        'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'dnt': '1',
        'sec-fetch-site': 'none',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',
        'accept-language': 'en-US,en;q=0.9',
        'priority': 'u=0, i',
    }
    
    for attempt in range(max_retries):
        try:
            print(f"Attempt {attempt + 1}/{max_retries} - Making request...")
            response = session.get(
                website_url, 
                headers=headers, 
                cookies=cookies, 
                verify=False,
                timeout=60  # Increase timeout to 60 seconds
            )
            if '_Incapsula_Resource' in response.text:
                print("You need to bypass Incapsula")
                return response.text
            print("Success! Response received")
            print("response:", response.text[:500] + "..." if len(response.text) > 500 else response.text)
            return response.text
            
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print("Retrying in 5 seconds...")
                time.sleep(5)
            else:
                print("All attempts failed")
                return None


def get_cookies(html, page_url):
    payload = {
        "clientKey": api_key,
        "task": {
            "type": "AntiImpervaTask",
            "websiteURL": page_url,
            "html": html  # The html of Incapsula when you request the target website
        }
    }
    res = requests.post("https://api.capsolver.com/createTask", json=payload, proxies=LOCAL_PROXY)
    resp = res.json()
    task_id = resp.get("taskId")
    if not task_id:
        print("Failed to create task:", res.text)
        return
    print(f"Got taskId: {task_id} / Getting result...")
    while True:
        payload = {"clientKey": api_key, "taskId": task_id}
        res = requests.post("https://api.capsolver.com/getTaskResult", json=payload, proxies=LOCAL_PROXY)
        resp = res.json()
        status = resp.get("status")
        if status == "ready":
            return resp.get("solution", {})
        if status == "failed" or resp.get("errorId"):
            print("Solve failed! response:", res.text)
            return


def main():
    print("Starting bypass process...")
    html = view_website()
    if not html:
        print("Failed to get initial HTML")
        return
        
    print("Getting cookies from CapSolver...")
    solution = get_cookies(html, website_url)
    if not solution:
        print("Failed to get solution from CapSolver")
        return
        
    cookies = solution.get("cookies")
    if not cookies:
        print("No cookies received from solution")
        return
        
    print("Get cookies:", cookies)
    
    # Convert cookies to proper format if needed
    if isinstance(cookies, dict):
        # Cookies are already in dict format, good
        print("Using cookies in dict format")
    else:
        print("Converting cookies to proper format")
        # Handle other cookie formats if needed
    
    print("Making request with obtained cookies...")
    result = view_website(cookies)
    if result:
        print("Success! Website accessed with cookies")
    else:
        print("Failed to access website with cookies")


if __name__ == '__main__':
    main()
