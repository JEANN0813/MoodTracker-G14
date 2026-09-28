class AlarmManager {
    constructor() {
        this.audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        this.audio.loop = true;
        this.alarms = JSON.parse(localStorage.getItem('alarms')) || [];
        this.isRinging = false;
    }

    init() {
        this.initEvents();
        this.loadAlarms();
        this.startPolling();
        
        
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }

    initEvents() {
        const stopBtn = document.getElementById('stopAlarmBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopAlarm());
        }
    }

    loadAlarms() {
        const listElement = document.getElementById('alarmListContainer');
        if (!listElement) return;

        if (this.alarms.length === 0) {
            listElement.innerHTML = `
                <li style="text-align: center; color: var(--text-muted); padding: 1rem; border:2px dashed var(--border-dark); border-radius:16px;">
                    No active alarms set.
                </li>`;
            return;
        }

        const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        listElement.innerHTML = this.alarms.map((alarm, index) => {
            const repeatDaysHtml = (alarm.repeat_days || [])
                .map(d => `<span class="alarm-day-tag">${d}</span>`)
                .join('');

            return `
                <li class="alarm-item">
                    <div>
                        <div class="alarm-time-text">${alarm.time}</div>
                        <div class="alarm-label-text">${alarm.title || 'Log Mood Reminder'}</div>
                        <div class="alarm-days-tags">${repeatDaysHtml || '<span class="alarm-day-tag">Once</span>'}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <label class="switch">
                            <input type="checkbox" ${alarm.is_enabled !== false ? 'checked' : ''} onchange="window.alarmManager.toggleAlarm(${index})">
                            <span class="slider"></span>
                        </label>
                        <button class="btn-delete" onclick="window.alarmManager.deleteAlarm(${index})" title="Delete Alarm">
                            <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                        </button>
                    </div>
                </li>
            `;
        }).join('');

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    handleCreate(e) {
        e.preventDefault();
        const timeInput = document.getElementById('alarmTimeInput');
        const labelInput = document.getElementById('alarmLabelInput');
        const dayCheckboxes = document.querySelectorAll('.alarm-day:checked');

        if (!timeInput || !timeInput.value) return;

        const selectedDays = Array.from(dayCheckboxes).map(cb => cb.value);

        const newAlarm = {
            id: Date.now(),
            time: timeInput.value,
            title: labelInput ? labelInput.value.trim() || 'Mood Logging Time' : 'Mood Logging Time',
            repeat_days: selectedDays,
            is_enabled: true
        };

        this.alarms.push(newAlarm);
        this.saveAlarms();
        
        
        timeInput.value = '';
        if (labelInput) labelInput.value = '';
        document.querySelectorAll('.alarm-day').forEach(cb => cb.checked = false);

        this.loadAlarms();
        if (window.showToastCard) {
            showToastCard('⏰ Alarm added successfully!');
        }
    }

    toggleAlarm(index) {
        if (this.alarms[index]) {
            this.alarms[index].is_enabled = !this.alarms[index].is_enabled;
            this.saveAlarms();
        }
    }

    deleteAlarm(index) {
        this.alarms.splice(index, 1);
        this.saveAlarms();
        this.loadAlarms();
    }

    saveAlarms() {
        localStorage.setItem('alarms', JSON.stringify(this.alarms));
    }

    startPolling() {
        setInterval(() => this.checkAlarms(), 5000);
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDay = daysMap[now.getDay()];

        this.alarms.forEach(alarm => {
            if (!alarm.is_enabled) return;

            const isTimeMatch = alarm.time === currentTime;
            const isDayMatch = alarm.repeat_days.length === 0 || alarm.repeat_days.includes(currentDay);

            if (isTimeMatch && isDayMatch && !this.isRinging) {
                this.triggerAlarm(alarm);
            }
        });
    }

    triggerAlarm(alarm) {
        this.isRinging = true;
        this.audio.play().catch(() => {});

       
        const modalTitle = document.getElementById('modalTitle');
        const modalTime = document.getElementById('modalTime');
        const modal = document.getElementById('alarmModal');

        if (modalTitle) modalTitle.innerText = `⏰ ${alarm.title}`;
        if (modalTime) modalTime.innerText = `Scheduled time: ${alarm.time}`;
        if (modal) modal.classList.remove('hidden');

       
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`⏰ ${alarm.title}`, {
                body: `It's ${alarm.time}! Time to record your current mood.`,
                icon: '/static/icons/alarm-icon.png'
            });
        }
    }

    stopAlarm() {
        this.isRinging = false;
        this.audio.pause();
        this.audio.currentTime = 0;
        const modal = document.getElementById('alarmModal');
        if (modal) modal.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.alarmManager = new AlarmManager();
    window.alarmManager.init();
});