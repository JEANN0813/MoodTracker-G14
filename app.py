
import sqlite3
import json
import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import hashlib
import uuid
import os

DATABASE_NAME = 'database.db'


# Database Functions
def get_db_connection():
    return sqlite3.connect(DATABASE_NAME)

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


# User Functions
def register_user(username, password, email=""):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        hashed_pw = hash_password(password)
        cursor.execute("""
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
        """, (username, email, hashed_pw))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return {"success": True, "user_id": user_id}
    except sqlite3.IntegrityError:
        conn.close()
        return {"success": False, "error": "Username already exists"}

def login_user(username, password):
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    hashed_pw = hash_password(password)
    cursor.execute(
        "SELECT * FROM users WHERE username = ? AND password_hash = ?",
        (username, hashed_pw)
    )
    user = cursor.fetchone()
    conn.close()
    if user:
        return {"success": True, "user": user}
    return {"success": False, "error": "Invalid credentials"}

def get_user_by_id(user_id):
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, created_at FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user

def update_user_profile(user_id, email=None, password=None, username=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if password:
        hashed_pw = hash_password(password)
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed_pw, user_id))
    if email:
        cursor.execute("UPDATE users SET email = ? WHERE id = ?", (email, user_id))
    if username:
        cursor.execute("UPDATE users SET username = ? WHERE id = ?", (username, user_id))
    
    conn.commit()
    conn.close()
    return {"success": True, "message": "Profile updated"}

def delete_user_account(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Account deleted"}


# Emotion Log Functions
def add_emotion_log(user_id, emotion, note="", log_date=None):
    if log_date is None:
        log_date = datetime.datetime.now().strftime("%Y-%m-%d")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO emotion_logs (user_id, emotion, note, log_date)
        VALUES (?, ?, ?, ?)
    """, (user_id, emotion, note, log_date))
    conn.commit()
    log_id = cursor.lastrowid
    conn.close()
    return {"success": True, "log_id": log_id}

def get_emotion_logs(user_id, start_date=None, end_date=None):
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    query = "SELECT * FROM emotion_logs WHERE user_id = ?"
    params = [user_id]
    if start_date:
        query += " AND log_date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND log_date <= ?"
        params.append(end_date)
    query += " ORDER BY log_date DESC, created_at DESC"
    cursor.execute(query, params)
    logs = cursor.fetchall()
    conn.close()
    return logs

def update_emotion_log(log_id, user_id, emotion=None, note=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if emotion:
        cursor.execute("UPDATE emotion_logs SET emotion = ? WHERE id = ? AND user_id = ?", (emotion, log_id, user_id))
    if note is not None:
        cursor.execute("UPDATE emotion_logs SET note = ? WHERE id = ? AND user_id = ?", (note, log_id, user_id))
    conn.commit()
    conn.close()
    return {"success": True}

def delete_emotion_log(log_id, user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM emotion_logs WHERE id = ? AND user_id = ?", (log_id, user_id))
    conn.commit()
    conn.close()
    return {"success": True}

def get_calendar_data(user_id, year, month):
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year+1}-01-01"
    else:
        end_date = f"{year}-{month+1:02d}-01"
    
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute("""
        SELECT log_date, emotion FROM emotion_logs
        WHERE user_id = ? AND log_date >= ? AND log_date < ?
        ORDER BY created_at DESC
    """, (user_id, start_date, end_date))
    logs = cursor.fetchall()
    conn.close()
    
    daily_emotions = {}
    for log in logs:
        if log['log_date'] not in daily_emotions:
            daily_emotions[log['log_date']] = log['emotion']
    return daily_emotions

def get_emotion_stats(user_id, days=30):
    start_date = (datetime.datetime.now() - datetime.timedelta(days=days)).strftime("%Y-%m-%d")
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute("""
        SELECT emotion, COUNT(*) as count FROM emotion_logs
        WHERE user_id = ? AND log_date >= ?
        GROUP BY emotion
    """, (user_id, start_date))
    stats = cursor.fetchall()
    conn.close()
    total = sum(s['count'] for s in stats)
    return {"total": total, "days": days, "statistics": stats}


# HTTP Request Handler
class MoodTrackerHandler(BaseHTTPRequestHandler):
    sessions = {}
    
    def get_user_id_from_cookie(self):
        cookie = self.headers.get('Cookie', '')
        if 'session=' in cookie:
            token = cookie.split('session=')[1].split(';')[0]
            return self.sessions.get(token)
        return None
    
    def send_json(self, data, status=200, session_token=None):
        response = json.dumps(data, ensure_ascii=False)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        if session_token:
            self.send_header('Set-Cookie', f'session={session_token}; Path=/; HttpOnly')
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))
    
    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query = parse_qs(parsed_url.query)
        user_id = self.get_user_id_from_cookie()
        
        if path == '/api/status':
            self.send_json({"status": "online", "version": "1.0"})
        
        elif path == '/api/user':
            if not user_id:
                self.send_json({"error": "Unauthorized"}, 401)
                return
            user = get_user_by_id(user_id)
            self.send_json(user if user else {"error": "Not found"})
        
        elif path == '/api/logs':
            if not user_id:
                self.send_json({"error": "Unauthorized"}, 401)
                return
            start = query.get('start_date', [None])[0]
            end = query.get('end_date', [None])[0]
            logs = get_emotion_logs(user_id, start, end)
            self.send_json({"logs": logs})
        
        elif path == '/api/calendar':
            if not user_id:
                self.send_json({"error": "Unauthorized"}, 401)
                return
            year = int(query.get('year', [datetime.datetime.now().year])[0])
            month = int(query.get('month', [datetime.datetime.now().month])[0])
            data = get_calendar_data(user_id, year, month)
            self.send_json({"year": year, "month": month, "data": data})
        
        elif path == '/api/stats':
            if not user_id:
                self.send_json({"error": "Unauthorized"}, 401)
                return
            days = int(query.get('days', [30])[0])
            stats = get_emotion_stats(user_id, days)
            self.send_json(stats)
        
        else:
            self.send_json({"error": "Not found"}, 404)
    
    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(post_data) if post_data else {}
        except json.JSONDecodeError:
            self.send_json({"error": "Invalid JSON"}, 400)
            return
        
        if path == '/api/register':
            username = data.get('username', '').strip()
            password = data.get('password', '').strip()
            email = data.get('email', '').strip()
            if not username or not password:
                self.send_json({"error": "Username and password required"}, 400)
                return
            result = register_user(username, password, email)
            self.send_json(result, 200 if result['success'] else 400)
        
        elif path == '/api/login':
            username = data.get('username', '').strip()
            password = data.get('password', '').strip()
            if not username or not password:
                self.send_json({"error": "Username and password required"}, 400)
                return
            result = login_user(username, password)
            if result['success']:
                token = str(uuid.uuid4())
                self.sessions[token] = result['user']['id']
                self.send_json({"success": True, "user": result['user']}, 200, token)
            else:
                self.send_json(result, 401)
        
        elif path == '/api/logout':
            cookie = self.headers.get('Cookie', '')
            if 'session=' in cookie:
                token = cookie.split('session=')[1].split(';')[0]
                if token in self.sessions:
                    del self.sessions[token]
            self.send_json({"message": "Logged out"})
        
        elif path == '/api/log':
            user_id = self.get_user_id_from_cookie()
            if not user_id:
                self.send_json({"error": "Unauthorized"}, 401)
                return
            emotion = data.get('emotion', '').strip()
            note = data.get('note', '').strip()
            log_date = data.get('date', None)
            if not emotion:
                self.send_json({"error": "Emotion required"}, 400)
                return
            result = add_emotion_log(user_id, emotion, note, log_date)
            self.send_json(result)
        
        else:
            self.send_json({"error": "Not found"}, 404)
    
    def do_PUT(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        user_id = self.get_user_id_from_cookie()
        
        if not user_id:
            self.send_json({"error": "Unauthorized"}, 401)
            return
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(post_data) if post_data else {}
        except json.JSONDecodeError:
            self.send_json({"error": "Invalid JSON"}, 400)
            return
        
        if path == '/api/profile':
            email = data.get('email')
            password = data.get('password')
            username = data.get('username')
            result = update_user_profile(user_id, email, password, username)
            self.send_json(result)
        
        elif path.startswith('/api/log/'):
            log_id = int(path.split('/')[-1])
            emotion = data.get('emotion')
            note = data.get('note')
            result = update_emotion_log(log_id, user_id, emotion, note)
            self.send_json(result)
        
        else:
            self.send_json({"error": "Not found"}, 404)
    
    def do_DELETE(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        user_id = self.get_user_id_from_cookie()
        
        if not user_id:
            self.send_json({"error": "Unauthorized"}, 401)
            return
        
        if path == '/api/account':
            result = delete_user_account(user_id)
            cookie = self.headers.get('Cookie', '')
            if 'session=' in cookie:
                token = cookie.split('session=')[1].split(';')[0]
                if token in self.sessions:
                    del self.sessions[token]
            self.send_json(result)
        
        elif path.startswith('/api/log/'):
            log_id = int(path.split('/')[-1])
            result = delete_emotion_log(log_id, user_id)
            self.send_json(result)
        
        else:
            self.send_json({"error": "Not found"}, 404)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        pass


# Start Server
def run_server(port=5000):
    print("=" * 60)
    print("🚀 MoodTracker API Server")
    print("=" * 60)
    print(f"📁 Database: {DATABASE_NAME}")
    print(f"🌐 Server: http://127.0.0.1:{port}")
    print("🔧 Pure Python - No Flask")
    print("=" * 60)
    print("\n📌 Available Endpoints:")
    print("  POST /api/register  - Register")
    print("  POST /api/login     - Login")
    print("  POST /api/logout    - Logout")
    print("  GET  /api/user      - Get profile")
    print("  PUT  /api/profile   - Update profile")
    print("  DELETE /api/account - Delete account")
    print("  POST /api/log       - Add emotion")
    print("  GET  /api/logs      - Get logs")
    print("  PUT  /api/log/{id}  - Update log")
    print("  DELETE /api/log/{id}- Delete log")
    print("  GET  /api/calendar  - Calendar data")
    print("  GET  /api/stats     - Statistics")
    print("\n📌 Press Ctrl+C to stop\n")
    
    server = HTTPServer(('', port), MoodTrackerHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == '__main__':
    run_server()