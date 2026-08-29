import sqlite3
from datetime import datetime, timedelta

DATABASE_NAME = 'database.db'

#CREATE_USERS_TABLE#
CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    security_question TEXT,
    security_answer_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""
#CREATE_LOGS_TABLE#
CREATE_LOGS_TABLE = """
CREATE TABLE IF NOT EXISTS emotion_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    emotion TEXT NOT NULL,
    note TEXT,
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
"""
#CREATE_INDEX# 
CREATE_INDEX = """
CREATE INDEX IF NOT EXISTS idx_logs_user_date 
ON emotion_logs (user_id, log_date);
"""


def create_tables(): 
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()

    cursor.execute(CREATE_USERS_TABLE)
    print("✅ Users Creation Successful")
    
    cursor.execute(CREATE_LOGS_TABLE)
    print("✅ Emotion_logs Creation Successful")
    
    cursor.execute(CREATE_INDEX)
    print("✅ Index Creation Successful")


    conn.commit()
    print(" Changes Saved")
    
    conn.close()
    print(" Database Connection Closed")
    
    return True

def insert_test_data():
    """插入一些测试数据，方便验证"""
    
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print("ℹ️ 数据库已有数据，跳过测试数据插入")
        conn.close()
        return
    
    test_users = [
        ('JeAnn', 'annannchan08132007@gmail.com', 'Ann0813~', 'What is your pet?', 'cat'),
        
    ]
    
    cursor.executemany("""
        INSERT INTO users (username, email, password_hash, security_question, security_answer_hash)
        VALUES (?, ?, ?, ?, ?)
    """, test_users)
    
    cursor.execute("SELECT id FROM users WHERE username = 'JeAnn'")
    JeAnn_id = cursor.fetchone()[0]
    
    
    today = datetime.now().date()
    test_logs = [
        (JeAnn_id, 'happy', 'Great day!', today.strftime('%Y-%m-%d')),
        (JeAnn_id, 'sad', 'Felt a bit down', (today - timedelta(days=1)).strftime('%Y-%m-%d')),
        (JeAnn_id, 'excited', 'Got good news!', (today - timedelta(days=2)).strftime('%Y-%m-%d')),
        
    ]
    
    cursor.executemany("""
        INSERT INTO emotion_logs (user_id, emotion, note, log_date)
        VALUES (?, ?, ?, ?)
    """, test_logs)
    
    conn.commit()
    conn.close()
    
    print("Test data inserted successfully")
    print(f"   - 1 test users")
    print(f"   - 5 Mood Logs")



def show_tables():
    
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    # show_table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print("\n" + "=" * 50)
    print("show_table:")
    print("=" * 50)
    
    for table in tables:
        table_name = table[0]
        print(f"\ntable_name: {table_name}")
        print("-" * 30)
        
    
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        for col in columns:
            col_id, name, data_type, not_null, default, is_pk = col
            nn_mark = "NOT NULL" if not_null else ""
            print(f"  {name}: {data_type} {nn_mark}")
    
    print("\n" + "=" * 50)
    conn.close()


def show_sample_data():
    
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    print("\n" + "=" * 50)
    print("Show_sample_data:")
    print("=" * 50)
    
    # show user
    cursor.execute("SELECT id, username, email, created_at FROM users")
    users = cursor.fetchall()
    
    print("\n Users:")
    for u in users:
        print(f"  ID: {u[0]}, 用户名: {u[1]}, 邮箱: {u[2]}, 创建时间: {u[3]}")
    
    # show mood log
    cursor.execute("""
        SELECT l.id, u.username, l.emotion, l.note, l.log_date 
        FROM emotion_logs l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.log_date DESC
    """)
    logs = cursor.fetchall()
    
    print("\n :")
    for log in logs:
        print(f"  ID: {log[0]}, Users: {log[1]}, emotion: {log[2]}, Remark: {log[3]}, Date: {log[4]}")
    
    print("\n" + "=" * 50)
    conn.close()


if __name__ == '__main__':
    print("=" * 60)
    print(" MoodTracker Database ")
    print("=" * 60)
    print()
    
    
    print("Creating a Database Table...")
    print("-" * 40)
    create_tables()
    print()
    
    
    print("Inserting Test Data...")
    print("-" * 40)
    insert_test_data()
    print()
    
   
    show_tables()
    
    
    show_sample_data()
    
    print("\n Database Completed")
    print(f"Database Files: {DATABASE_NAME}")
    print("Next Step: run python app.py to start the server")
    print("=" * 60)