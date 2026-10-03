# 2620 - Mini IT Project MoodTracker (G14)

> A web application for tracking daily emotions, visualizing mood trends, and building mindful daily habits.


Ahmed Rayyan Rashard bin Ahmed Ramzi ( Advanced Analytics & Smart Features) 	
-Core state, mood chart, dashboard UI

CHAN JE ANN ( Backend & Database)
- Authentication, calendar, history view, alarms

Aya Ahmed Almasyabi ( Frontend Pages & User Interaction)
- Profile page, statistics, avatar management

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

- **Backend:** Python, Flask, SQLAlchemy, APScheduler
- **Frontend:** HTML, CSS, JavaScript, Chart.js
- **Database:** SQLite
- **AI:** Google Gemini API

---

## Setup

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd MoodTracker

###2. Create a virtual environment
bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

###3. Install dependencies
bash
pip install -r requirements.txt

###4. Create .env
Copy .env.example to .env and fill in:

text
SECRET_KEY=your-random-secret
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
GEMINI_API_KEY=your-gemini-api-key

###5. Run the app
bash
python app.py
Open http://127.0.0.1:5000 in your browser.

Project Structure
text
MoodTracker/
├── backend/          # Flask app, routes, models
├── static/           # HTML, CSS, JS
├── app.py            # Entry point
├── requirements.txt
└── README.md

### `.env.example`
SECRET_KEY=change-me
DATABASE_URL=sqlite:///database.db
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
GEMINI_API_KEY=your-gemini-key

### `.gitignore`
pycache/
*.py[cod]
venv/
.env
*.db
*.sqlite
instance/
.vscode/
.DS_Store
