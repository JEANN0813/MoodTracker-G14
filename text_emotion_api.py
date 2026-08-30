import requests
import json

print("=" * 50)
print("Testing Emotion Log API")
print("=" * 50)

BASE_URL = "http://127.0.0.1:5000"

# 1. Login first to get session
print("\n[1] Logging in...")
session = requests.Session()
login_data = {"username": "jeann", "password": "0813"}
login_response = session.post(f"{BASE_URL}/api/login", json=login_data)

if login_response.status_code != 200:
    print("Login failed! Please register first.")
    exit()

print("Login successful!")

# 2. Create an emotion log
print("\n[2] Creating emotion log...")
log_data = {
    "emotion": "happy",
    "note": "Beautiful sunny day!",
    "date": "2026-08-30"
}
response = session.post(f"{BASE_URL}/api/logs", json=log_data)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# 3. Get all emotion logs
print("\n[3] Getting all emotion logs...")
response = session.get(f"{BASE_URL}/api/logs")
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Total logs: {len(data['logs'])}")
    for log in data['logs']:
        print(f"  - ID: {log['id']}, Emotion: {log['emotion']}, Note: {log['note']}, Date: {log['log_date']}")

# 4. Update an emotion log (use the first log ID)
print("\n[4] Updating emotion log...")
# First get logs to get an ID
response = session.get(f"{BASE_URL}/api/logs")
if response.status_code == 200 and len(response.json()['logs']) > 0:
    log_id = response.json()['logs'][0]['id']
    update_data = {
        "emotion": "excited",
        "note": "Updated: Feeling even better!"
    }
    response = session.put(f"{BASE_URL}/api/logs/{log_id}", json=update_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

# 5. Delete an emotion log
print("\n[5] Deleting emotion log...")
# First get logs to get an ID
response = session.get(f"{BASE_URL}/api/logs")
if response.status_code == 200 and len(response.json()['logs']) > 0:
    log_id = response.json()['logs'][0]['id']
    response = session.delete(f"{BASE_URL}/api/logs/{log_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

print("\n" + "=" * 50)
print("Emotion Log API test completed!")
print("=" * 50)