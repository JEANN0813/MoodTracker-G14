# -*- coding: utf-8 -*-
"""
Database Design - MoodTracker
Contains Users table and Emotion Logs table
"""

import sqlite3
from datetime import datetime, timedelta

DATABASE_NAME = 'database.db'


# Users table
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


# Emotion Logs table
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


# Index for better query performance
CREATE_INDEX = """
CREATE INDEX IF NOT EXISTS idx_logs_user_date 
ON emotion_logs (user_id, log_date);
"""


def create_tables():
    """Create all tables and indexes"""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    cursor.execute(CREATE_USERS_TABLE)
    print("Users table created successfully")
    
    cursor.execute(CREATE_LOGS_TABLE)
    print("Emotion logs table created successfully")
    
    cursor.execute(CREATE_INDEX)
    print("Index created successfully")
    
    conn.commit()
    conn.close()
    print("Database saved successfully")
    return True


def insert_test_data():
    """Insert test data for verification"""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print("Test data already exists, skipping insertion")
        conn.close()
        return
    
    # Insert test user - JeAnn
    test_users = [
        ('JeAnn', 'jeann@email.com', '0813', 'What is your pet?', 'Cat'),
    ]
    
    cursor.executemany("""
        INSERT INTO users (username, email, password_hash, security_question, security_answer_hash)
        VALUES (?, ?, ?, ?, ?)
    """, test_users)
    
    # Get user ID
    cursor.execute("SELECT id FROM users WHERE username = 'JeAnn'")
    jeann_id = cursor.fetchone()[0]
    
    # Insert test emotion logs for JeAnn
    today = datetime.now().date()
    test_logs = [
        (jeann_id, 'happy', 'Great day!', today.strftime('%Y-%m-%d')),
        (jeann_id, 'sad', 'Felt a bit down', (today - timedelta(days=1)).strftime('%Y-%m-%d')),
        (jeann_id, 'excited', 'Got good news!', (today - timedelta(days=2)).strftime('%Y-%m-%d')),
        (jeann_id, 'happy', 'Wonderful weather', (today - timedelta(days=3)).strftime('%Y-%m-%d')),
        (jeann_id, 'anxious', 'Feeling stressed about exam', (today - timedelta(days=4)).strftime('%Y-%m-%d')),
    ]
    
    cursor.executemany("""
        INSERT INTO emotion_logs (user_id, emotion, note, log_date)
        VALUES (?, ?, ?, ?)
    """, test_logs)
    
    conn.commit()
    conn.close()
    
    print("Test data inserted successfully")
    print("   - 1 test user (JeAnn)")
    print("   - 5 emotion logs")


def show_tables():
    """Display the structure of all tables"""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print("=" * 60)
    print("Tables in the database:")
    print("=" * 60)
    
    for table in tables:
        table_name = table[0]
        print(f"Table: {table_name}")
        print()
        
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        for col in columns:
            col_id, name, data_type, not_null, default, is_pk = col
            pk_mark = "PK " if is_pk else "   "
            nn_mark = "NOT NULL" if not_null else ""
            print(f"  {pk_mark}{name}: {data_type} {nn_mark}")
        print()
    
    conn.close()


def show_sample_data():
    """Display sample data from tables"""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("Sample Data:")
    print("=" * 60)
    
    # Display users
    cursor.execute("SELECT id, username, email, created_at FROM users")
    users = cursor.fetchall()
    
    print("Users:")
    for u in users:
        print(f"  ID: {u[0]}, Username: {u[1]}, Email: {u[2]}, Created: {u[3]}")
    
    print("=" * 60)
    
    # Display emotion logs
    cursor.execute("""
        SELECT l.id, u.username, l.emotion, l.note, l.log_date 
        FROM emotion_logs l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.log_date DESC
    """)
    logs = cursor.fetchall()
    
    print("Emotion Logs:")
    for log in logs:
        print(f"  ID: {log[0]}, User: {log[1]}, Emotion: {log[2]}, Note: {log[3]}, Date: {log[4]}")
    
    print("=" * 60)
    conn.close()


if __name__ == '__main__':
    print("=" * 60 )
    print("MoodTracker Database Design")
    print("=" * 60)
    
    # Create tables
    print("Creating database tables...")
    create_tables()
    print("=" * 60)
    
    # Insert test data
    print("Inserting test data...")
    insert_test_data()
    print("=" * 60)
    
    # Display table structures
    show_tables()
    
    # Display sample data
    show_sample_data()
    
    print("Database design completed!")
    print(f"Database file: {DATABASE_NAME}")
    print("Next step: Run 'python app.py' to start the server")
    print("=" * 60)