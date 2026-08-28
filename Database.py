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


