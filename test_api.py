import requests
import json

print("=" * 50)
print("Testing MoodTracker API")
print("=" * 50)

# 1. Test status
print("\n[1] Testing /api/status...")
try:
    response = requests.get('http://127.0.0.1:5000/api/status')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# 2. Test register
print("\n[2] Testing /api/register...")
try:
    data = {
        "username": "jeann",
        "email": "jeanne@gmail.com",
        "password": "0813"
    }
    response = requests.post('http://127.0.0.1:5000/api/register', json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# 3. Test login
print("\n[3] Testing /api/login...")
try:
    data = {
        "username": "jeann",
        "password": "0813"
    }
    response = requests.post('http://127.0.0.1:5000/api/login', json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# [3.5] Testing /api/forgot-password...
print("\n[3.5] Testing /api/forgot-password...")
forgot_payload = {"email": "annannchan08132007@gmail.com"} # Use your registered email
resp = requests.post("http://127.0.0.1:5000/api/forgot-password", json=forgot_payload)
print(f"Status: {resp.status_code}")
data = resp.json()
print(f"Response: {data}")

# Get the reset code (For testing convenience, assume the backend returns the code directly)
reset_code = data.get('reset_code')
if not reset_code:
    print("Test failed: Failed to retrieve the reset code!")
else:
    # [3.6] Testing /api/reset-password...
    print("\n[3.6] Testing /api/reset-password...")
    reset_payload = {
        "email": "annannchan08132007@gmail.com",
        "reset_code": reset_code,
        "new_password": "new_secure_password_123"
    }
    resp = requests.post("http://127.0.0.1:5000/api/reset-password", json=reset_payload)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}")
    
    # After changing the password, try logging in with the new password to verify it works
    # (You can add a simple login test here)


# 4. Test get user info (after login)
print("\n[4] Testing /api/user (after login)...")
try:
    login_data = {"username": "jeann", "password": "0813"}
    session = requests.Session()
    login_response = session.post('http://127.0.0.1:5000/api/login', json=login_data)
    
    if login_response.status_code == 200:
        user_response = session.get('http://127.0.0.1:5000/api/user')
        print(f"Status: {user_response.status_code}")
        print(f"Response: {user_response.json()}")
    else:
        print("Login failed, cannot test /api/user")
except Exception as e:
    print(f"Error: {e}")

# 5. Test add emotion log (after login)
print("\n[5] Testing /api/logs (POST)...")
try:
    login_data = {"username": "jeann", "password": "0813"}
    session = requests.Session()
    login_response = session.post('http://127.0.0.1:5000/api/login', json=login_data)
    
    if login_response.status_code == 200:
        log_data = {
            "emotion": "happy",
            "note": "Great day!",
            "date": "2026-08-29"
        }
        log_response = session.post('http://127.0.0.1:5000/api/logs', json=log_data)
        print(f"Status: {log_response.status_code}")
        print(f"Response: {log_response.json()}")
    else:
        print("Login failed, cannot test /api/logs")
except Exception as e:
    print(f"Error: {e}")

# 6. Test get logs
print("\n[6] Testing /api/logs (GET)...")
try:
    login_data = {"username": "jeann", "password": "0813"}
    session = requests.Session()
    login_response = session.post('http://127.0.0.1:5000/api/login', json=login_data)
    
    if login_response.status_code == 200:
        logs_response = session.get('http://127.0.0.1:5000/api/logs')
        print(f"Status: {logs_response.status_code}")
        print(f"Response: {logs_response.json()}")
    else:
        print("Login failed, cannot test /api/logs")
except Exception as e:
    print(f"Error: {e}")

# 7. Test calendar data
print("\n[7] Testing /api/calendar/2026/8...")
try:
    login_data = {"username": "jeann", "password": "0813"}
    session = requests.Session()
    login_response = session.post('http://127.0.0.1:5000/api/login', json=login_data)
    
    if login_response.status_code == 200:
        calendar_response = session.get('http://127.0.0.1:5000/api/calendar/2026/8')
        print(f"Status: {calendar_response.status_code}")
        print(f"Response: {calendar_response.json()}")
    else:
        print("Login failed, cannot test /api/calendar")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 50)
print("Test completed!")
print("=" * 50)