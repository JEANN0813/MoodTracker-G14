# 2620 - Mini IT Project MoodTracker (G14)

> A web application for tracking daily emotions, visualizing mood trends, and building mindful daily habits.


Ahmed Rayyan Rashard bin Ahmed Ramzi ( Advanced Analytics & Smart Features) 	
-Core state, mood chart, dashboard UI

CHAN JE ANN ( Backend & Database)
- Authentication, calendar, history view, alarms

Aya Ahmed Almasyabi ( Frontend Pages & User Interaction)
- Profile page, statistics, avatar management

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [License](#license)
- [Team](#team)

---

## Features

- **Daily Mood Logging** — Record your emotional state with one tap (Happy / Calm / Neutral / Sad / Anxious).
- **Calendar View** — Click any date to review entries or backfill a missed day.
- **Mood Charts** — Monthly line chart tracking your emotional trend over time.
- **Mood Insights** — Automatic summary of your overall mood, dominant emotion, and trends.
- **Custom Alarms** — Set daily reminders to log your mood, scheduled by the backend.
- **AI Mood Assistant** — Chat with a Gemini-powered assistant for supportive reflection.
- **User Profiles** — Manage your account, choose an avatar, and view personal statistics.
- **Authentication** — Secure registration, login, password reset via email verification code.

---

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript, Chart.js, Lucide   |
| Backend    | Python 3.10+, Flask, SQLAlchemy, APScheduler        |
| Database   | SQLite (development) / PostgreSQL (production)      |
| Auth       | Flask session + Werkzeug password hashing           |
| AI         | Google Gemini API (`google-genai`)                  |
| Email      | Flask-Mail (Gmail SMTP)                             |

---
## Project Structure
MoodTracker/
├── backend/
│ ├── init.py # Application factory
│ ├── config.py # Configuration (reads .env)
│ ├── extensions.py # db, mail, cors, scheduler
│ ├── models.py # User, EmotionLog, Alarm
│ ├── routes/
│ │ ├── init.py # Blueprint registry
│ │ ├── auth_routes.py # /api/register, /api/login, ...
│ │ ├── user_routes.py # /api/user
│ │ ├── log_routes.py # /api/logs, /api/calendar
│ │ ├── chat_routes.py # /api/chat
│ │ ├── stats_routes.py # /api/stats, /api/analysis/*
│ │ ├── alarm_routes.py # /api/alarms, /api/alarms/check
│ │ └── static_routes.py # Static files + /api/status
│ └── utils/
│ ├── init.py
│ ├── auth_helpers.py # get_current_user
│ └── validators.py # validate_password_strength, validate_email
│
├── static/ # Frontend assets
│ ├── index.html
│ ├── style.css
│ └── js/
│ ├── utils.js
│ ├── dashboard.js
│ ├── moodLogs.js
│ ├── calendar.js
│ ├── history.js
│ ├── profile.js
│ ├── auth.js
│ └── alarms.js
│
├── app.py # Entry point
├── requirements.txt # Python dependencies
├── .env # Secrets (NOT committed)
├── .gitignore
└── README.md


---

## Prerequisites

- **Python** 3.10 or higher
- **pip** 22+
- **Git**
- A modern browser (Chrome, Firefox, Edge, Safari)
- *(Optional)* A Gmail account with an **App Password** for sending verification codes
- *(Optional)* A **Google Gemini API key** for the AI assistant

---

# ============================================================
# MoodTracker - Environment Variables (TEMPLATE)
# Copy this file to .env and fill in real values.
# ============================================================

SECRET_KEY=replace-with-a-random-64-char-hex-string
DATABASE_URL=sqlite:///C:/path/to/MoodTracker/database.db
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
GEMINI_API_KEY=your-gemini-api-key

2. .gitignore
gitignore
# ============================================================
# Python
# ============================================================
__pycache__/
*.py[cod]
*.so
venv/
env/
.venv/
*.egg-info/
.pytest_cache/
.coverage
htmlcov/

# ============================================================
# Database
# ============================================================
*.db
*.sqlite
*.sqlite3
instance/

# ============================================================
# Environment Variables (IMPORTANT!)
# ============================================================
.env

# ============================================================
# Editors / IDEs
# ============================================================
.vscode/
.idea/
*.swp
*.swo
*~

# ============================================================
# OS
# ============================================================
.DS_Store
Thumbs.db

# ============================================================
# Logs
# ============================================================
*.log
logs/

# ============================================================
# Build artifacts
# ============================================================
dist/
build/
*.min.js
*.min.css
3. LICENSE（MIT）
text
MIT License

Copyright (c) 2026 MoodTracker Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.