// ==========================================
// JEANN
// ==========================================

// ALARM 

let _alarmAudio = null;
let _isAlarmRinging = false;
let _lastDismissedAt = 0; 
let _currentRingingAlarmId = null;
let _alarmPollTimer = null;

function startAlarmPolling() {
    if (_alarmPollTimer) return;

    
    _alarmPollTimer = setInterval(async () => {
        if (_isAlarmRinging) return;   

        try {
            const res = await fetch('/api/alarms/check', { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();

            if (data.triggered && data.alarms.length > 0) {
                triggerAlarm(data.alarms[0]);
            }
        } catch (err) {
            console.error('Poll alarms error:', err);
        }
    }, 20000);
}


function triggerAlarm(alarm) {
    _isAlarmRinging = true;
    _currentRingingAlarmId = alarm.id;

    if (!_alarmAudio) {
        _alarmAudio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        _alarmAudio.loop = true;
    }
    _alarmAudio.play().catch(() => {});

    const modal = document.getElementById('alarmModal');
    const title = document.getElementById('modalTitle');
    const timeEl = document.getElementById('modalTime');

   
    if (title) title.textContent = `⏰ ${alarm.title || 'Alarm'}`;
    if (timeEl) timeEl.textContent = `Scheduled time: ${alarm.alarm_time}`;
    if (modal) modal.classList.remove('hidden');

    if (window.lucide) lucide.createIcons();

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`⏰ ${alarm.title || 'Alarm'}`, {
            body: `It's ${alarm.alarm_time}`
        });
    }
}

async function checkAlarms() {
    if (_isAlarmRinging) return;

    // Dismiss 
    if (Date.now() - _lastDismissedAt < 90000) return;

    try {
        const response = await fetch('/api/alarms/check', { credentials: 'include' });
        if (!response.ok) return;
        const data = await response.json();

        if (data.triggered && data.alarms.length > 0) {
            triggerAlarm(data.alarms[0]);
        }
    } catch (err) {
        console.error('Check alarms error:', err);
    }
}

async function stopAlarm() {
    _isAlarmRinging = false;

    if (_currentRingingAlarmId) {
        try {
            await fetch(`/api/alarms/${_currentRingingAlarmId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_enabled: false })
            });
        } catch (e) {
            console.warn('Failed to disable alarm:', e);
        }
        _currentRingingAlarmId = null;
        await loadAlarmsFromServer();
    }

    if (_alarmAudio) {
        _alarmAudio.pause();
        _alarmAudio.currentTime = 0;
        _alarmAudio.src = '';
        _alarmAudio = null;
    }

    const modal = document.getElementById('alarmModal');
    if (modal) modal.classList.add('hidden');
}

function startLocalAlarmScheduler() {
    setInterval(() => {
        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentSeconds = now.getSeconds();

       
        if (currentSeconds >= 0 && currentSeconds < 5 && !_isAlarmRinging) {
            const alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
            const matchedAlarm = alarms.find(a => a.enabled && a.time === currentHHMM);

            if (matchedAlarm) {
                triggerAlarm(matchedAlarm);
            }
        }
    }, 3000); 
}

document.addEventListener('DOMContentLoaded', () => {
    loadAlarmsFromServer();
    startAlarmPolling();
});

async function addAlarm(event) {
    if (event) event.preventDefault();

    const timeInput = document.getElementById('alarmTimeInput');
    const labelInput = document.getElementById('alarmLabelInput');

    if (!timeInput || !timeInput.value) {
        return showToastCard('Please select a time');
    }

    const payload = {
        time: timeInput.value,                         
        title: (labelInput?.value || '').trim() || 'Alarm',
        repeat_days: []                                
    };

    try {
        const res = await fetch('/api/alarms', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return showToastCard('❌ ' + (err.error || 'Failed to add alarm'));
        }

        timeInput.value = '';
        if (labelInput) labelInput.value = '';

        await loadAlarmsFromServer();   
        showToastCard('⏰ Alarm added!');
    } catch (err) {
        showToastCard('❌ Network error');
    }
}

async function loadAlarmsFromServer() {
    try {
        const res = await fetch('/api/alarms', { credentials: 'include' });
        if (!res.ok) return;
        const alarms = await res.json();
        renderAlarms(alarms);
    } catch (err) {
        console.error('Load alarms error:', err);
    }
}

function renderAlarms(alarms) {
    const list = document.getElementById('alarmListContainer');
    if (!list) return;

    if (!alarms || alarms.length === 0) {
        list.innerHTML = `<li><span>No alarms set.</span></li>`;
        return;
    }

    list.innerHTML = alarms.map(a => `
        <li>
            <div>
                <strong>${a.alarm_time}</strong> — <span>${a.title}</span>
                ${a.is_enabled ? '' : ' <em>(disabled)</em>'}
            </div>
            <button class="btn-delete" onclick="deleteAlarm(${a.id})" title="Delete">
                <i data-lucide="trash-2" style="width:14px;"></i>
            </button>
        </li>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

async function deleteAlarm(id) {
    try {
        const res = await fetch(`/api/alarms/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            await loadAlarmsFromServer();
            showToastCard('Alarm removed.');
        }
    } catch (err) {
        showToastCard('❌ Network error');
    }
}
