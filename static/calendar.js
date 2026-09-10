let currentDate = new Date();

function renderCalendarWithData() {
    const calendar = document.getElementById("calendarDays");
    if (!calendar) return;

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

   
    fetch('/api/logs', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            const logs = data.logs || data || [];
            const MOOD_EMOJI_MAP = {
                'Happy': '😊', 'Calm': '😌', 'Neutral': '😐',
                'Anxious': '😰', 'Sad': '😢'
            };

            const logMap = {};
            if (Array.isArray(logs)) {
                logs.forEach(log => {
                    const dateKey = log.log_date || log.date;
                    const emotionKey = log.emotion || log.mood;
                    if (dateKey) logMap[dateKey] = MOOD_EMOJI_MAP[emotionKey] || '😐';
                });
            }

            calendar.innerHTML = "";

           
            for (let i = 0; i < firstDay; i++) {
                const emptyDay = document.createElement("div");
                emptyDay.className = "day empty";
                calendar.appendChild(emptyDay);
            }

           
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement("div");
                dayElement.className = "day";

                const dayNum = String(day).padStart(2, '0');
                const monthNum = String(month + 1).padStart(2, '0');
                const dateKey = `${year}-${monthNum}-${dayNum}`;

                const emoji = logMap[dateKey] ? logMap[dateKey] : '';

                dayElement.innerHTML = `
                    <span class="day-number">${day}</span>
                    <div class="calendar-emoji">${emoji}</div>
                `;
                calendar.appendChild(dayElement);
            }
        })
        .catch(err => console.error('Calendar error:', err));
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendarWithData(currentYear, currentMonth); 
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendarWithData(currentYear, currentMonth); 
}
const MOOD_EMOJI_MAP = {
    'Happy': '😊',
    'Calm': '😌',
    'Neutral': '😐',
    'Anxious': '😰',
    'Sad': '😢'
};


