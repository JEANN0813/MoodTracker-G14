

// Aya: Emotion Selection & Logging

let selectedEmotion = null;

// Emotion selection
const moods = document.querySelectorAll(".mood");

moods.forEach(mood => {
    mood.addEventListener("click", () => {
        moods.forEach(m => m.classList.remove("selected"));
        mood.classList.add("selected");
        selectedEmotion = mood.dataset.emotion;
    });
});

// Log mood
function logMood() {
    const note = document.getElementById("moodNote").value;

    if (!selectedEmotion) {
        alert("Please select an emotion first.");
        return;
    }

    console.log({ emotion: selectedEmotion, note: note });

    fetch('/api/logs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            emotion: selectedEmotion,
            note: note
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Mood logged successfully! 😊");
            document.getElementById("moodNote").value = "";
            moods.forEach(m => m.classList.remove("selected"));
            selectedEmotion = null;
            // Refresh stats and calendar
            fetchStats();
            fetchCalendar();
        } else {
            alert("Failed to log mood. Please try again.");
        }
    })
    .catch(err => {
        alert("Error: " + err.message);
    });
}



// Aya: Calendar

let currentDate = new Date();

function generateCalendar() {
    const calendar = document.getElementById("calendarDays");
    if (!calendar) return;

    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthYearDisplay = document.getElementById("monthYear");
    if (monthYearDisplay) {
        monthYearDisplay.textContent = monthNames[month] + " " + year;
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty spaces
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "day";
        calendar.appendChild(emptyDay);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement("div");
        dayElement.className = "day";
        dayElement.innerHTML = `<span>${day}</span>`;
        calendar.appendChild(dayElement);
    }
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
}

// Fetch calendar data from API
function fetchCalendar() {
    // This will be expanded when API is ready
    generateCalendar();
}



// ReRay: Emotion Analysis & Stats
// Fetch user data
function fetchUserData() {
    fetch('/api/user')
        .then(res => {
            if (res.status === 401) {
                window.location.href = '/index.html';
                return;
            }
            return res.json();
        })
        .then(data => {
            if (data && data.username) {
                document.getElementById('username-display').innerText = data.username;
            }
        })
        .catch(() => {});
}

// Fetch stats from backend
function fetchStats() {
    fetch('/api/stats?days=30')
        .then(res => res.json())
        .then(data => {
            // Update total logs
            document.getElementById('stat-total').innerText = data.total || 0;

            // Calculate emotion breakdown
            let anxious = 0, happy = 0, neutral = 0;
            (data.statistics || []).forEach(item => {
                if (item.emotion === 'Anxious' || item.emotion === 'Sad') {
                    anxious += item.count;
                } else if (item.emotion === 'Happy') {
                    happy += item.count;
                } else {
                    neutral += item.count;
                }
            });

            document.getElementById('stat-anxious').innerText = anxious;
            document.getElementById('stat-happy').innerText = happy;
            document.getElementById('stat-neutral').innerText = neutral;

            // Update insights
            updateInsights(data);
        })
        .catch(err => {
            console.error('Stats error:', err);
        });
}

// Update insights section (ReRay)
function updateInsights(data) {
    const stats = data.statistics || [];
    
    // Most common emotion
    if (stats.length > 0) {
        const top = stats.reduce((a, b) => a.count > b.count ? a : b);
        const emotionNames = {
            'Happy': '😊 Happy',
            'Sad': '😢 Sad',
            'Anxious': '😰 Anxious',
            'Neutral': '😐 Neutral',
            'Calm': '😌 Calm'
        };
        document.getElementById('insight-most-common').innerText = 
            emotionNames[top.emotion] || top.emotion;
    }

    // Trend analysis
    const trendElement = document.getElementById('insight-trend');
    if (trendElement) {
        const happy = stats.find(s => s.emotion === 'Happy');
        const sad = stats.find(s => s.emotion === 'Sad');
        const anxious = stats.find(s => s.emotion === 'Anxious');
        
        if (happy && happy.count > 5 && (!sad || sad.count < 3)) {
            trendElement.innerText = '↗ Your mood appears to be improving! Keep it up!';
            trendElement.style.color = '#27ae60';
        } else if (sad && sad.count > 3) {
            trendElement.innerText = '↘ You seem to be feeling down lately. Consider talking to someone.';
            trendElement.style.color = '#e74c3c';
        } else {
            trendElement.innerText = '➡ Your mood is relatively stable.';
            trendElement.style.color = '#555';
        }
    }
}

// Fetch recent logs
function fetchLogs() {
    fetch('/api/logs')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('logs-table-body');
            if (!data.logs || data.logs.length === 0) {
                tbody.innerHTML = `
                    <tr><td colspan="4" class="text-center text-muted">
                        No entries logged yet. Write your first reflection above!
                    </td></tr>`;
                return;
            }

            tbody.innerHTML = data.logs.slice(0, 10).map(log => `
                <tr>
                    <td class="fw-semibold">${log.log_date}</td>
                    <td><span class="badge ${getEmotionBadge(log.emotion)}">${log.emotion}</span></td>
                    <td class="text-muted">${log.note || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteLog(${log.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(err => {
            console.error('Logs error:', err);
        });
}

function getEmotionBadge(emotion) {
    if (emotion === 'Happy') return 'bg-success';
    if (emotion === 'Anxious' || emotion === 'Sad') return 'bg-warning text-dark';
    return 'bg-secondary';
}

// Delete log
function deleteLog(id) {
    if (!confirm('Are you sure you want to delete this log?')) return;

    fetch(`/api/logs/${id}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(() => {
        fetchStats();
        fetchLogs();
        fetchCalendar();
    })
    .catch(err => {
        alert('Error deleting log: ' + err.message);
    });
}

// Logout
function logout() {
    fetch('/api/logout', {
        method: 'POST'
    })
    .then(() => window.location.href = '/index.html')
    .catch(() => window.location.href = '/index.html');
}



// CHATBOT (ReRay)
function openChat() {
    // Simple rule-based chatbot
    const userMessage = prompt("Hi! I'm your Mood Assistant. How are you feeling right now?");
    
    if (!userMessage) return;
    
    const lower = userMessage.toLowerCase();
    let response = "";
    
    if (['sad', 'depressed', 'down', 'cry'].some(w => lower.includes(w))) {
        response = "😢 I'm sorry you're feeling down. Remember that it's okay to feel this way. Try talking to a friend, or write down your thoughts. You're not alone! 💙";
    } else if (['anxious', 'stressed', 'worried', 'panic'].some(w => lower.includes(w))) {
        response = "😰 I understand you're feeling anxious. Try taking 5 deep breaths. Inhale for 4 seconds, hold for 4, exhale for 4. You've got this! 🧘";
    } else if (['happy', 'good', 'great', 'excited'].some(w => lower.includes(w))) {
        response = "😊 That's wonderful to hear! Keep spreading that positive energy. You deserve to be happy! 🌟";
    } else {
        response = "🤗 Thanks for sharing! Remember, every emotion is valid. I'm here to listen anytime. 💬";
    }
    
    alert("Mood Assistant: " + response);
}


// INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        dateElement.innerText = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // Load data
    fetchUserData();
    fetchStats();
    fetchLogs();
    fetchCalendar();
});

// Make functions globally accessible for onclick attributes
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.logMood = logMood;
window.openChat = openChat;
window.logout = logout;
window.deleteLog = deleteLog;