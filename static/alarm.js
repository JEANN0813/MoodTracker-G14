class AlarmManager {
    constructor() {
        this.audio = new Audio('/static/audio/alarm.mp3');
        this.audio.loop = true;
        this.triggeredKeys = new Set();
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

       
        document.addEventListener('click', () => {
            this.audio.load();
        }, { once: true });
    }

    async loadAlarms() {
        try {
            const response = await fetch('/api/alarms');
            const alarms = await response.json();
            const listElement = document.getElementById('alarmList');

            if (!listElement) return;

            if (alarms.length === 0) {
                listElement.innerHTML = '<li style="color: var(--text-muted); padding: 0.5rem 0;">No active alarms set.</li>';
                return;
            }

            listElement.innerHTML = alarms.map(alarm => `
                <li class="alarm-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #eee;">
                    <div>
                        <strong style="font-size: 1.1rem;">${alarm.alarm_time}</strong> 
                        <span style="margin-left: 0.5rem; color: #666;">${alarm.title}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <input type="checkbox" ${alarm.is_enabled ? 'checked' : ''} 
                               onchange="alarmManager.toggleAlarm(${alarm.id}, this.checked)">
                        <button class="btn-secondary" style="color: #e74c3c; padding: 0.25rem 0.5rem;" onclick="alarmManager.deleteAlarm(${alarm.id})">Delete</button>
                    </div>
                </li>
            `).join('');
        } catch (error) {
            console.error('Failed to load alarms:', error);
        }
    }

    async handleCreate(e) {
    e.preventDefault();
    
    const timeInput = document.getElementById('alarmTime');
    const titleInput = document.getElementById('alarmTitle');
    
    const time = timeInput ? timeInput.value : '';
    const title = titleInput && titleInput.value.trim() ? titleInput.value.trim() : 'Alarm';
    
    const checkboxes = document.querySelectorAll('.repeat-days input:checked');
    const repeat_days = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (!time) {
        alert('Please select a valid time.');
        return;
    }

    try {
        const response = await fetch('/api/alarms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time, title, repeat_days })
        });

        const data = await response.json();

        if (response.ok) {
          
            document.getElementById('alarmForm').reset();
            
            await this.loadAlarms();
        if (window.showToastCard) {
                showToastCard('⏰ Alarm added successfully!');
            }
        } else {
        if (window.showToastCard) {
                showToastCard('❌ Failed to add alarm: ' + (data.error || 'Unknown error'));
            }
        }
    } catch (error) {
        console.error('Failed to create alarm:', error);
        if (window.showToastCard) {
            showToastCard('❌ Network error. Please try again.');
        }
    }
}

   
async toggleAlarm(id, is_enabled) {
    try {
        await fetch(`/api/alarms/${id}`, { 
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_enabled })
        });
    } catch (error) {
        console.error('Failed to toggle alarm:', error);
    }
}

    async deleteAlarm(id) {
        try {
            await fetch(`/api/alarms/${id}`, { method: 'DELETE' });
            this.loadAlarms();
        } catch (error) {
            console.error('Failed to delete alarm:', error);
        }
    }

    startPolling() {
        this.checkAlarms();
        setInterval(() => this.checkAlarms(), 10000); 
    }

    async checkAlarms() {
        try {
            const response = await fetch('/api/alarms/check');
            const data = await response.json();

            if (data.triggered && data.alarms && data.alarms.length > 0) {
                data.alarms.forEach(alarm => this.triggerAlarm(alarm));
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }

    triggerAlarm(alarm) {
        const now = new Date();
        const minuteKey = `${alarm.id}-${now.getHours()}:${now.getMinutes()}`;

        if (this.triggeredKeys.has(minuteKey)) return;
        this.triggeredKeys.add(minuteKey);

        this.audio.play().catch(err => console.warn('Autoplay prevented:', err));

        const modalTitle = document.getElementById('modalTitle');
        const modalTime = document.getElementById('modalTime');
        const modal = document.getElementById('alarmModal');

        if (modalTitle) modalTitle.innerText = `⏰ ${alarm.title}`;
        if (modalTime) modalTime.innerText = `Scheduled time: ${alarm.alarm_time}`;
        if (modal) modal.classList.remove('hidden');

        this.loadAlarms();
    }

    stopAlarm() {
        this.audio.pause();
        this.audio.currentTime = 0;
        const modal = document.getElementById('alarmModal');
        if (modal) modal.classList.add('hidden');
    }
}


const alarmManager = new AlarmManager();


document.addEventListener('DOMContentLoaded', () => {
    alarmManager.init();
});