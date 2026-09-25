class AlarmManager {
    constructor() {
        this.audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        this.audio.loop = true;
        this.alarms = JSON.parse(localStorage.getItem('alarms')) || [];
    }

    init() {
        this.initEvents();
        this.loadAlarms();
        this.startPolling();
    }

    initEvents() {
        const form = document.getElementById('alarmForm');
        const stopBtn = document.getElementById('stopAlarmBtn');

        if (form) {
            form.addEventListener('submit', (e) => this.handleCreate(e));
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopAlarm());
        }
    }

    loadAlarms() {
        const listElement = document.getElementById('alarmList');
        if (!listElement) return;

        if (this.alarms.length === 0) {
            listElement.innerHTML = '<li style="color: var(--text-muted); padding: 0.5rem 0;">No active alarms set.</li>';
            return;
        }

        listElement.innerHTML = this.alarms.map((alarm, index) => `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #eee;">
                <div>
                    <strong>${alarm.time}</strong> - <span>${alarm.title}</span>
                </div>
                <button class="btn-secondary" style="color: #e74c3c; padding: 0.25rem 0.5rem;" onclick="window.alarmManager.deleteAlarm(${index})">Delete</button>
            </li>
        `).join('');
    }

    handleCreate(e) {
        e.preventDefault();
        const timeInput = document.getElementById('alarmTime');
        const titleInput = document.getElementById('alarmTitle');

        if (!timeInput || !timeInput.value) return;

        const newAlarm = {
            time: timeInput.value,
            title: titleInput ? titleInput.value : 'Alarm'
        };

        this.alarms.push(newAlarm);
        localStorage.setItem('alarms', JSON.stringify(this.alarms));
        timeInput.value = '';
        if (titleInput) titleInput.value = '';

        this.loadAlarms();
        if (window.showToastCard) showToastCard('⏰ Alarm added successfully!');
    }

    deleteAlarm(index) {
        this.alarms.splice(index, 1);
        localStorage.setItem('alarms', JSON.stringify(this.alarms));
        this.loadAlarms();
    }

    startPolling() {
        setInterval(() => this.checkAlarms(), 5000);
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        this.alarms.forEach(alarm => {
            if (alarm.time === currentTime && !this.isRinging) {
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