// ==========================================
// JEANN
// ==========================================

//  CALENDAR LOGIC  
function generateCalendar() {
    const calendarGrid = document.getElementById("calendarDays");
    if (!calendarGrid) return;

    calendarGrid.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthYearElem = document.getElementById("monthYear");
    if (monthYearElem) {
        monthYearElem.innerText = `${monthNames[month]} ${year}`;
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "day-cell empty-cell";
        emptyCell.style.opacity = "0.2";
        emptyCell.style.cursor = "default";
        calendarGrid.appendChild(emptyCell);
    }

    
    const EMOTION_PRIORITY = ['Happy', 'Calm', 'Neutral', 'Sad', 'Anxious'];

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.className = "day-cell";

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.setAttribute("data-date", dateStr);

        if (dateStr === activeTargetDate) dayCell.classList.add("selected-day");

        const dayLogs = moodLogs.filter(l => l.log_date === dateStr);

        if (dayLogs.length > 0) {
            
            const emotionCounts = {};
            dayLogs.forEach(l => {
                emotionCounts[l.emotion] = (emotionCounts[l.emotion] || 0) + 1;
            });

           
            const dominantEmotion = Object.keys(emotionCounts).sort((a, b) => {
                if (emotionCounts[b] !== emotionCounts[a]) {
                    return emotionCounts[b] - emotionCounts[a];   
                }
                return EMOTION_PRIORITY.indexOf(a) - EMOTION_PRIORITY.indexOf(b);   
            })[0];

            const iconName = EMOTION_ICON_MAP[dominantEmotion] || 'smile';
            const totalCount = dayLogs.length;

            let cellContent = `<span>${day}</span><span class="day-mood-icon"><i data-lucide="${iconName}" style="width: 14px;"></i></span>`;

            
            if (totalCount > 1) {
                cellContent += `<span class="multi-entry-badge" style="position: absolute; top: 2px; right: 2px; background: #ff6b6b; color: white; font-size: 0.65rem; padding: 1px 5px; border-radius: 8px; font-weight: 800;">${totalCount}</span>`;
            }

            dayCell.style.position = 'relative';
            dayCell.innerHTML = cellContent;
        } else {
            dayCell.innerHTML = `<span>${day}</span>`;
        }

        dayCell.onclick = () => openDayDetailModal(dateStr, dayLogs);
        calendarGrid.appendChild(dayCell);
    }
}

function renderStandaloneCalendar() {
    const container = document.getElementById('standaloneCalendarContainer');
    if (!container) return;

    if (moodLogs.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-weight: 600;">No mood entries logged yet.</p>`;
        return;
    }

    container.innerHTML = `
        <div style="padding: 1.5rem; background: var(--canvas-bg); border: 2px solid var(--border-dark); border-radius: 20px;">
            <h3 style="margin-bottom: 1rem; font-family: var(--font-serif);">Calendar Logs Overview</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem;">
                ${moodLogs.map(l => `
                    <div style="background: white; border: 2px solid var(--border-dark); padding: 1rem; border-radius: 16px; box-shadow: 2px 2px 0px var(--border-dark);">
                        <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted);">${l.log_date}</div>
                        <div style="font-size: 1rem; font-weight: 800; margin: 0.4rem 0; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="${l.iconName || 'smile'}" style="width: 16px;"></i> ${l.emotion}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-dark); opacity: 0.8;">${l.note}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    refreshUI();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    refreshUI();
}


