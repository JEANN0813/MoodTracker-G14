

// 1. STATE & GLOBAL VARIABLES
let activeUser = "User";
let activeUserId = null;
let selectedEmotion = null;
let selectedIcon = "";
let currentDate = new Date();
let activeTargetDate = new Date().toISOString().split('T')[0];

const DAILY_EMOTION_LIMIT = 5;

let moodLogs = JSON.parse(localStorage.getItem('moodLogs')) || [
    { id: 1, log_date: new Date().toISOString().split('T')[0], emotion: "Happy", iconName: "smile", note: "Welcome to your fresh sanctuary dashboard!" }
];

const EMOTION_ICON_MAP = {
    'Happy': 'smile',
    'Calm': 'sun',
    'Neutral': 'meh',
    'Sad': 'frown',
    'Anxious': 'alert-circle'
};


// 2. AUTHENTICATION & TAB SWITCHING
function switchAuthTab(tab) {
    const vLogin = document.getElementById('authViewLogin');
    const vReg = document.getElementById('authViewRegister');
    const vReset = document.getElementById('authViewReset');
    const tabHeader = document.getElementById('authTabsHeader');

    if (vLogin) vLogin.classList.add('hidden');
    if (vReg) vReg.classList.add('hidden');
    if (vReset) vReset.classList.add('hidden');

    if (tabHeader) {
        tabHeader.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
    }

    if (tab === 'login') {
        if (vLogin) vLogin.classList.remove('hidden');
        if (tabHeader && tabHeader.children[0]) tabHeader.children[0].classList.add('active');
    } else if (tab === 'register') {
        if (vReg) vReg.classList.remove('hidden');
        if (tabHeader && tabHeader.children[1]) tabHeader.children[1].classList.add('active');
    } else if (tab === 'reset') {
        if (vReset) vReset.classList.remove('hidden');
    if (tabHeader && tabHeader.children[2]) tabHeader.children[2].classList.add('active');
    
    // Reset to Step 1 when switching to Reset tab
    const step1 = document.getElementById('resetStep1');
    const step2 = document.getElementById('resetStep2');
    if (step1) step1.classList.remove('hidden');
    if (step2) step2.classList.add('hidden');
}
    if (window.lucide) lucide.createIcons();
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    const usernameOrEmail = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameOrEmail, password: password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            activeUser = data.user.username;
            activeUserId = data.user.id;
            showToastCard('Login successful!');
            enterSanctuary();
        } else {
            showToastCard('❌ ' + (data.error || 'Login failed'));
        }
    } catch (err) {
        showToastCard('❌ Network error during login.');
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const nameInput = document.getElementById('regFullName');
    const emailInput = document.getElementById('regEmail');
    const passwordInput = document.getElementById('regPassword');

    const username = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToastCard('✅ Account created successfully! Please log in.');
            switchAuthTab('login');
        } else {
            showToastCard('❌ ' + (data.error || 'Registration failed'));
        }
    } catch (err) {
        showToastCard('❌ Network error during registration.');
    }
}

async function handleResetSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();

    if (!email) {
        showToastCard('Please enter your email address');
        return;
    }

    try {
        const response = await fetch('/api/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();
        
        if (response.ok) {
            showToastCard('✅ Verification code sent! Check your email.');
            document.getElementById('resetStep1').classList.add('hidden');
            document.getElementById('resetStep2').classList.remove('hidden');
        } else {
            showToastCard('❌ ' + (data.error || 'Failed to send code'));
        }
    } catch (err) {
        showToastCard('❌ Server error. Please try again later.');
    }
}

async function handlePasswordResetConfirm(event) {
    event.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    const code = document.getElementById('resetCode').value.trim();
    const newPassword = document.getElementById('resetNewPassword').value.trim();

    if (!email || !code || !newPassword) {
        showToastCard('Please fill in all fields.');
        return;
    }

    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, password: newPassword })
        });

        const data = await response.json();
        
        if (response.ok) {
            showToastCard('✅ Password updated! Redirecting to login...');
            document.getElementById('resetStep1').classList.remove('hidden');
            document.getElementById('resetStep2').classList.add('hidden');
            setTimeout(() => { switchAuthTab('login'); }, 1500);
        } else {
            showToastCard('❌ ' + (data.error || 'Failed to reset password.'));
        }
    } catch (err) {
        showToastCard('❌ Server error. Please try again later.');
    }
}

function enterSanctuary() {
    document.getElementById('logoutFab')?.classList.remove('hidden');
    const userDisp = document.getElementById('userDisplayName');
    const profileText = document.getElementById('profileUserText');
    const authScr = document.getElementById('authScreen');
    const landingScr = document.getElementById('landingScreen'); 
    const appLay = document.getElementById('appLayout');

    if (userDisp) userDisp.innerText = activeUser;
    if (profileText) profileText.innerText = `Active User: ${activeUser}`;
    
    
    if (landingScr) landingScr.classList.add('hidden'); 
    if (authScr) authScr.classList.add('hidden');
    
    
    if (appLay) appLay.classList.remove('hidden');

    fetchLogsAndRefresh();
}

async function logout() {
    
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
        console.error('Logout error', e);
    }

    const authScr = document.getElementById('authScreen');
    const appLay = document.getElementById('appLayout');

    if (appLay) appLay.classList.add('hidden');
    if (authScr) authScr.classList.remove('hidden');
    
    switchAuthTab('login');
    showToastCard('Portal locked successfully.');
}


// 3. UI NAVIGATION & SELECTION

function switchView(viewId, element) {
    const views = ['dashboardView', 'historyView', 'profileView'];   // ⬅️ 只有这 3 个
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
    if (element) element.classList.add('active');

    
    if (viewId === 'historyView') {
        setHistoryStyle(historyStyle);
    }

    
    if (viewId === 'profileView') {
        if (typeof initProfilePage === 'function') {
            try { initProfilePage(); } catch (e) { console.warn(e); }
        }
    }

    if (window.lucide) lucide.createIcons();
}

function selectEmotion(btn, emotion, iconName) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedEmotion = emotion;
    selectedIcon = iconName || 'smile';
}


// 4. MOOD LOGGING & LOCAL DATA HANDLERS
async function fetchLogsAndRefresh() {
    try {
        const response = await fetch('/api/logs', { method: 'GET' });
        if (response.ok) {
            const data = await response.json();
            moodLogs = (data.logs || []).map(log => ({
                ...log,
                iconName: EMOTION_ICON_MAP[log.emotion] || 'smile'
            }));
            console.log("Mood logs:", moodLogs);
            refreshUI();
        } else if (response.status === 401) {
            logout();
        }
    } catch (err) {
        showToastCard('❌ Failed to load logs from server.');
    }
}

function generateMoodNote(emotion) {
    const notes = {
        Happy: "You're feeling positive today! Keep doing what makes you happy.",
        Calm: "You seem calm today. Take some time to enjoy this peaceful moment.",
        Neutral: "It's okay to have a neutral day. Take things at your own pace.",
        Sad: "You seem to be having a difficult day. Consider taking a break or talking to someone you trust.",
        Anxious: "You seem anxious today. Try taking a few slow breaths and giving yourself a moment to relax."
    };

    return notes[emotion] || "Take a moment to check in with yourself today.";
}

async function logMood() {
    const note = generateMoodNote(selectedEmotion);

    if (!selectedEmotion) {
        showToastCard("Please select an emotion first!");
        return;
    }

    // Limit mood logging to 5 entries per day
    const targetDateLogs = moodLogs.filter(
        log => log.log_date === activeTargetDate
    );

    if (targetDateLogs.length >= DAILY_EMOTION_LIMIT) {
        showToastCard("You can only log up to 5 moods per day.");
        return;
    }

    try {
        const response = await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emotion: selectedEmotion,
                note: note,
                date: activeTargetDate
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            selectedEmotion = null;
            selectedIcon = "";

            showToastCard(`Mood successfully stamped for ${activeTargetDate}!`);
            await fetchLogsAndRefresh();
        } else {
            showToastCard('❌ ' + (data.error || 'Failed to save log'));
        }
    } catch (err) {
        showToastCard('❌ Network error while saving log.');
    }
}

async function deleteLog(id) {
    try {
        const response = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
        const data = await response.json();

        if (response.ok) {
            showToastCard("Entry removed.");
            await fetchLogsAndRefresh();
        } else {
            showToastCard('❌ ' + (data.error || 'Failed to delete log'));
        }
    } catch (err) {
        showToastCard('❌ Network error while deleting log.');
    }
}

function resetLoggingDateToToday() {
    activeTargetDate = new Date().toISOString().split('T')[0];
    refreshUI();
}


// 5. CALENDAR LOGIC
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

            
            const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
                emotionCounts[a] > emotionCounts[b] ? a : (emotionCounts[a] === emotionCounts[b] ? a : b)
            );

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


// 6. REFRESH UI & STATS CALCULATIONS
function refreshUI() {
    const loggingDateDisp = document.getElementById('loggingDateDisplay');
    const selectedTargetLbl = document.getElementById('selectedTargetDateLabel');
    const dateLabel = document.getElementById('currentDateLabel');

    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    if (dateLabel) dateLabel.innerText = new Date().toLocaleDateString('en-US', options);

    if (loggingDateDisp) loggingDateDisp.innerText = activeTargetDate;
    if (selectedTargetLbl) selectedTargetLbl.innerText = activeTargetDate;

    renderTable();
    calculateStats();
    generateCalendar();
    renderHistoryTable();      
    if (window.lucide) lucide.createIcons();
}


function renderHistoryTable() {
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;

    if (!Array.isArray(moodLogs) || moodLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:1.5rem 0;">No logs yet. Go to Dashboard to log your first mood!</td></tr>`;
        return;
    }

    tbody.innerHTML = moodLogs.map(log => `
        <tr>
            <td>${log.log_date}</td>
            <td>
                <span class="badge-emotion" style="background:${getEmotionBg(log.emotion)}">
                    <i data-lucide="${log.iconName || 'smile'}" style="width:14px;"></i> ${log.emotion}
                </span>
            </td>
            <td style="color:var(--text-muted);">${log.note || '—'}</td>
            <td>
                <button class="btn-delete" onclick="deleteLog(${log.id})">
                    <i data-lucide="trash-2" style="width:14px;"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

function renderTable() {
    const tbody = document.getElementById('logs-table-body');
    if (!tbody) return;

    if (moodLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">No logs yet. Select an emotion above to stamp your day!</td></tr>`;
        return;
    }

    tbody.innerHTML = moodLogs.slice(0, 8).map(log => `
        <tr>
            <td>${log.log_date}</td>
            <td>
                <span class="badge-emotion" style="background: ${getEmotionBg(log.emotion)}">
                    <i data-lucide="${log.iconName || 'smile'}" style="width: 14px;"></i> ${log.emotion}
                </span>
            </td>
            <td style="color: var(--text-muted);">${log.note}</td>
            <td>
                <button class="btn-delete" onclick="deleteLog(${log.id})">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getEmotionBg(emotion) {
    if (emotion === 'Happy') return 'var(--card-mint)';
    if (emotion === 'Calm') return '#e2f0cb';
    if (emotion === 'Sad' || emotion === 'Anxious') return 'var(--banner-pink)';
    return '#f1f2f6';
}

function calculateStats() {
    const totalElem = document.getElementById('stat-total');
    if (totalElem) totalElem.innerText = moodLogs.length;

    let happy = 0;
    let anxious = 0;
    let neutral = 0;

    moodLogs.forEach(function(l) {
        if (l.emotion === 'Happy' || l.emotion === 'Calm') {
            happy++;
        } else if (l.emotion === 'Anxious' || l.emotion === 'Sad') {
            anxious++;
        } else {
            neutral++;
        }
    });

    const happyElem = document.getElementById('stat-happy');
    const anxiousElem = document.getElementById('stat-anxious');
    const neutralElem = document.getElementById('stat-neutral');

    if (happyElem) happyElem.innerText = happy;
    if (anxiousElem) anxiousElem.innerText = anxious;
    if (neutralElem) neutralElem.innerText = neutral;

    const mostCommonElem = document.getElementById('insight-most-common');
    const overallElem = document.getElementById('insight-overall');
    const descElem = document.getElementById('insight-desc');

    if (moodLogs.length > 0) {
        const latest = moodLogs[0];

        if (mostCommonElem) {
            mostCommonElem.innerHTML =
                '<i data-lucide="' +
                (latest.iconName || 'smile') +
                '" style="width: 18px;"></i> ' +
                latest.emotion;
        }

        // Determine overall mood
        if (happy > anxious && happy > neutral) {
            if (overallElem) {
                overallElem.innerHTML =
                    'Positive <i data-lucide="smile" style="width: 22px;"></i>';
            }

            if (descElem) {
                descElem.innerText =
                    'Your logs reflect more positive emotions overall.';
            }

        } else if (anxious > happy && anxious > neutral) {
            if (overallElem) {
                overallElem.innerHTML =
                    'Needs Care <i data-lucide="frown" style="width: 22px;"></i>';
            }

            if (descElem) {
                descElem.innerText =
                    'Higher anxiety or stress appears in your recent logs. Consider taking small breaks.';
            }

        } else {
            if (overallElem) {
                overallElem.innerHTML =
                    'Balanced <i data-lucide="meh" style="width: 22px;"></i>';
            }

            if (descElem) {
                descElem.innerText =
                    'Your emotions are relatively balanced across your recent logs.';
            }
        }
    } else {
        if (mostCommonElem) {
            mostCommonElem.innerText = 'None yet';
        }
    }
}

// 7. MODALS & UTILITIES
function openDayDetailModal(dateStr, loggedEntry) {
    const dateTitle = document.getElementById('dayModalDateTitle');
    if (dateTitle) dateTitle.innerText = dateStr;

    const contentDiv = document.getElementById('dayModalContent');
    const actionBtn = document.getElementById('dayModalActionBtn');

    if (contentDiv) {
        if (loggedEntry) {
            contentDiv.innerHTML = `
                <div style="background: var(--sidebar-bg); border: 2px solid var(--border-dark); border-radius: 16px; padding: 1rem;">
                    <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.1rem; margin-bottom: 0.4rem;">
                        <i data-lucide="${loggedEntry.iconName || 'smile'}" style="width: 20px;"></i> ${loggedEntry.emotion}
                    </div>
                    <p style="font-size: 0.85rem; font-weight: 600; color: var(--text-dark);">"${loggedEntry.note}"</p>
                </div>
            `;
        } else {
            contentDiv.innerHTML = `
                <p style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted);">
                    No mood logged for this date yet. You can set this as your active target date to log an entry!
                </p>
            `;
        }
    }

    if (actionBtn) {
        actionBtn.onclick = () => {
            activeTargetDate = dateStr;
            toggleDayDetailModal(false);
            refreshUI();
        };
    }

    toggleDayDetailModal(true);
    if (window.lucide) lucide.createIcons();
}

function toggleDayDetailModal(show) {
    const modal = document.getElementById('dayDetailModal');
    if (modal) {
        modal.classList.toggle('hidden', !show);
    }
}

function toggleAssistantModal(show) {
    const modal = document.getElementById('assistantModal');
    if (modal) {
        modal.classList.toggle('hidden', !show);
    }
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const userMsg = input ? input.value.trim() : '';

    if (!userMsg) return;

    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    // Add user's message
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerText = userMsg;
    chatHistory.appendChild(userBubble);

    input.value = '';
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
        // Send message to Flask API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMsg
            })
        });

        const data = await response.json();

        // Add assistant response
        const botBubble = document.createElement('div');
        botBubble.className = 'chat-bubble assistant';

        if (response.ok && data.reply) {
            botBubble.innerText = data.reply;
        } else {
            botBubble.innerText = data.error || 'Sorry, I could not generate a response.';
        }

        chatHistory.appendChild(botBubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;

    } catch (error) {
        console.error('Chat API error:', error);

        const botBubble = document.createElement('div');
        botBubble.className = 'chat-bubble assistant';
        botBubble.innerText = 'Sorry, I could not connect to the Mood Assistant right now.';

        chatHistory.appendChild(botBubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}

// Your HTML Send button currently calls handleChatSend()
function handleChatSend() {
    sendChatMessage();
}

function showToastCard(message) {
    const toast = document.createElement('div');
    toast.className = 'modal-card';
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: auto; padding: 1rem 1.5rem; z-index: 2000; background: var(--accent-yellow); font-weight: 800; font-size: 0.85rem; border: 2px solid var(--border-dark); box-shadow: 4px 4px 0px var(--border-dark);';
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => { toast.remove(); }, 2500);
}

// 8. INITIALIZATION
document.addEventListener('DOMContentLoaded', async function () {
    
    const splash = document.getElementById("welcomeSplash");
    if (splash) {
        setTimeout(() => { splash.classList.add("hidden-splash"); }, 1500);
    }

    
    const landingScr = document.getElementById('landingScreen');
    const appLay = document.getElementById('appLayout');
    const authScr = document.getElementById('authScreen');

    if (landingScr) landingScr.classList.remove('hidden');   
    if (appLay) appLay.classList.add('hidden');
    if (authScr) authScr.classList.add('hidden');

    
    try {
        const response = await fetch('/api/user', { method: 'GET' });

        if (response.ok) {
            const user = await response.json();
            activeUser = user.username;
            activeUserId = user.id;
            enterSanctuary();   
        }
        
    } catch (err) {
        console.warn('Session check failed:', err);
       
    }

    if (window.lucide) lucide.createIcons();
});


// ALARM 

let _alarmAudio = null;
let _isAlarmRinging = false;

function triggerAlarm(alarm) {
    _isAlarmRinging = true;

    
    if (!_alarmAudio) {
        _alarmAudio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        _alarmAudio.loop = true;
    }
    _alarmAudio.play().catch(() => {});

    
    const modal = document.getElementById('alarmModal');
    const title = document.getElementById('modalTitle');
    const timeEl = document.getElementById('modalTime');

    if (title) title.textContent = `⏰ ${alarm.label || 'Alarm'}`;
    if (timeEl) timeEl.textContent = `Scheduled time: ${alarm.time}`;
    if (modal) modal.classList.remove('hidden');

    if (window.lucide) lucide.createIcons();

    
    if (Notification && Notification.permission === 'granted') {
        new Notification(`⏰ ${alarm.label || 'Alarm'}`, {
            body: `It's ${alarm.time}`
        });
    }
}

function stopAlarm() {
    _isAlarmRinging = false;

    if (_alarmAudio) {
        _alarmAudio.pause();
        _alarmAudio.currentTime = 0;
    }

    const modal = document.getElementById('alarmModal');
    if (modal) modal.classList.add('hidden');
}


document.addEventListener('DOMContentLoaded', function () {
    const stopBtn = document.getElementById('stopAlarmBtn');
    if (stopBtn) stopBtn.addEventListener('click', stopAlarm);

    
    setInterval(function () {
        if (_isAlarmRinging) return;   

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
        alarms.forEach(alarm => {
            if (alarm.time === currentTime && alarm.enabled !== false) {
                triggerAlarm(alarm);
            }
        });
    }, 10000);
});


// ==========================================================================
// PROFILE VIEW LOGIC (Aya)
// ==========================================================================

/**
 * Initializes and populates the Profile Page UI components and dynamic stats.
 */
async function initProfilePage() {
    await loadUserProfileDetails();
    calculateAndRenderStats();
    loadSavedAvatar();
}

/**
 * Loads user details from localStorage or active session state.
 */
async function loadUserProfileDetails() {
    try {
        const response = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            console.warn('loadUserProfileDetails: HTTP', response.status);
            return;
        }

        const user = await response.json();
        console.log('✅ Profile user from backend:', user);

        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('activeUser', user.username || 'User');
        localStorage.setItem('userEmail', user.email || '');

       
        const nameEl = document.getElementById('profileUserName');
        const emailEl = document.getElementById('profileUserEmail');
        if (nameEl) nameEl.textContent = user.username || 'User';
        if (emailEl) emailEl.textContent = user.email || '—';

        // Active User
        const activeUserEl = document.getElementById('profileUserText');
        if (activeUserEl) activeUserEl.textContent = `Active User: ${user.username || 'User'}`;

        
        const birthdayEl = document.getElementById('profileBirthday');
        if (birthdayEl) birthdayEl.textContent = user.birthday || '—';

       
        const genderEl = document.getElementById('profileGender');
        if (genderEl) genderEl.textContent = user.gender || '—';

        
        const titleEl = document.getElementById('profileTitle');
        if (titleEl) titleEl.textContent = user.title || 'Bronze Tracker 🏆';

        
        if (user.avatar) {
            const avatarEl = document.getElementById('currentAvatarDisplay');
            if (avatarEl) avatarEl.textContent = user.avatar;
            localStorage.setItem('selectedAvatar', user.avatar);
        }

        // Dashboard 
        const userDisp = document.getElementById('userDisplayName');
        if (userDisp) userDisp.textContent = user.username || 'User';

    } catch (err) {
        console.error('loadUserProfileDetails error:', err);
    }
}
/**
 * Computes mood statistics (Total Entries, Logging Streak, Dominant Mood, Progress)
 * from stored mood log entries and updates the profile UI.
 */
function calculateAndRenderStats() {
  // Fetch logs from localStorage (or fallback to empty array)
  const moodLogs = JSON.parse(localStorage.getItem('moodLogs') || '[]');

  // 1. Total Entries
  const totalLogs = moodLogs.length;
  const totalLogsEl = document.getElementById('profileTotalLogs');
  if (totalLogsEl) animateCounter(totalLogsEl, 0, totalLogs, 800);

  // 2. Active Logging Streak (Consecutive Days)
  const streak = calculateStreak(moodLogs);
  const streakEl = document.getElementById('profileStreak');
  if (streakEl) streakEl.textContent = `${streak} ${streak === 1 ? 'Day' : 'Days'}`;

  // 3. Dominant Mood Calculation
  const topMood = calculateDominantMood(moodLogs);
  const topMoodEl = document.getElementById('profileTopMood');
  if (topMoodEl) topMoodEl.textContent = topMood;

  // 4. Monthly Progress Bar (Goal: 30 Days)
  const targetDays = 30;
  const completionPercent = Math.min(Math.round((totalLogs / targetDays) * 100), 100);

  const progressBar = document.getElementById('profileProgressBar');
  const percentText = document.getElementById('progressPercentText');

  if (progressBar) progressBar.style.width = `${completionPercent}%`;
  if (percentText) percentText.textContent = `${completionPercent}% Complete`;
}

/**
 * Handles avatar selection click events and saves preferences locally.
 * @param {string} emoji - The selected avatar emoji icon
 */
async function selectAvatar(emoji) {
  const currentAvatarEl = document.getElementById('currentAvatarDisplay');
  if (currentAvatarEl) {
    currentAvatarEl.textContent = emoji;
    currentAvatarEl.style.transform = 'scale(1.2) rotate(10deg)';
    setTimeout(() => { currentAvatarEl.style.transform = ''; }, 200);
  }

  document.querySelectorAll('.avatar-opt').forEach(btn => {
    if (btn.textContent.trim() === emoji) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  localStorage.setItem('selectedAvatar', emoji);

  
  try {
    await fetch('/api/user', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: emoji })
    });
  } catch (err) {
    console.warn('Failed to save avatar:', err);
  }
}

function loadSavedAvatar() {
  const savedAvatar = localStorage.getItem('selectedAvatar') || '🌸';
  selectAvatar(savedAvatar);
}

// ==========================================================================
// HELPER CALCULATIONS
// ==========================================================================

/**
 * Calculates current consecutive daily logging streak.
 */
function calculateStreak(logs) {
  if (!logs || logs.length === 0) return 0;

  // Sort unique dates descending
  const uniqueDates = [...new Set(logs.map(log => log.date))].sort().reverse();
  const todayStr = new Date().toISOString().split('T')[0];

  let streak = 0;
  let checkDate = new Date();

  for (let i = 0; i < uniqueDates.length; i++) {
    const logDate = uniqueDates[i];
    const expectedStr = checkDate.toISOString().split('T')[0];

    if (logDate === expectedStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0 && logDate !== todayStr) {
      // If no log today, check if user logged yesterday to maintain streak
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split('T')[0];
      if (logDate === yesterdayStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Determines the user's most frequently logged mood.
 */
function calculateDominantMood(logs) {
  if (!logs || logs.length === 0) return 'None';

  const counts = {};
  logs.forEach(log => {
    const mood = log.mood || 'Neutral';
    counts[mood] = (counts[mood] || 0) + 1;
  });

  let dominant = 'None';
  let maxCount = 0;

  for (const [mood, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = mood;
    }
  }

  // Capitalize first letter
  return dominant.charAt(0).toUpperCase() + dominant.slice(1);
}

/**
 * Animated number counting helper.
 */
function animateCounter(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    element.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}
function showView(viewName) {
  // ... your existing hide/show section code ...

  if (viewName === 'profile') {
    initProfilePage();
  }
}
// Logout handler
function handleLogout() {
  localStorage.removeItem('activeUser');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('selectedAvatarName');
  localStorage.removeItem('selectedAvatarUrl');
  
  // Refresh page or redirect to index/login
  window.location.href = 'index.html';
}



// Auto-run when document loads
// Load active user sign-in info into profile display
document.addEventListener('DOMContentLoaded', () => {
  // Read from the same localStorage key used across your app
  const currentUserRaw = localStorage.getItem('currentUser');
  let userName = 'Aya';
  let userEmail = 'aya@example.com';

  if (currentUserRaw) {
    try {
      const parsed = JSON.parse(currentUserRaw);
      if (typeof parsed === 'object' && parsed !== null) {
        userName = parsed.name || parsed.username || userName;
        userEmail = parsed.email || userEmail;
      } else if (typeof parsed === 'string') {
        userName = parsed;
      }
    } catch (e) {
      // Handles cases where currentUser is stored as a plain string
      userName = currentUserRaw;
    }
  }

  const nameEl = document.getElementById('profileUserName');
  const emailEl = document.getElementById('profileUserEmail');

  if (nameEl) nameEl.textContent = userName;
  if (emailEl) emailEl.textContent = userEmail;
});

function loadActiveUserProfile() {
  // 1. Try to fetch the active logged-in user object from storage
  const sessionUser = JSON.parse(
    localStorage.getItem('currentUser') || 
    sessionStorage.getItem('currentUser') || 
    '{}'
  );

  // 2. Fall back to individual email/name keys if stored separately during login
  const activeEmail = sessionUser.email || localStorage.getItem('userEmail') || localStorage.getItem('loginEmail');
  const activeName = sessionUser.name || localStorage.getItem('userName') || (activeEmail ? activeEmail.split('@')[0] : '');

  // 3. Populate DOM elements dynamically
  const nameDisplay = document.getElementById('profileUserName');
  const emailDisplay = document.getElementById('profileUserEmail');

  if (nameDisplay && activeName) {
    nameDisplay.textContent = activeName;
  }
  
  if (emailDisplay && activeEmail) {
    emailDisplay.textContent = activeEmail;
  }
}

// Automatically load when the DOM is ready
document.addEventListener('DOMContentLoaded', loadActiveUserProfile);

// Function to load the logged-in user's profile details
function loadUserProfile() {
  // Retrieve the logged-in user object/email stored during sign-in
  const currentUserJson = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
  
  if (currentUserJson) {
    const user = JSON.parse(currentUserJson);
    
    // Set email input to the signed-in email
    const emailInput = document.getElementById("profileUserEmailInput");
    if (emailInput && user.email) {
      emailInput.value = user.email;
    }

    // Set name input (use display name, derive from email, or fallback)
    const nameInput = document.getElementById("profileUserNameInput");
    if (nameInput) {
      const derivedName = user.name || user.email.split("@")[0];
      nameInput.value = derivedName;
    }
  }
}

function switchDashboardTab(tabName) {
    const overviewSec = document.getElementById('dashboardOverviewSection');
    const historySec = document.getElementById('dashboardHistorySection');
    const btnOverview = document.getElementById('btnDashboardOverview');
    const btnHistory = document.getElementById('btnDashboardHistory');

    if (tabName === 'overview') {
        overviewSec.style.display = 'flex';
        historySec.classList.add('hidden');
        btnOverview.style.background = 'var(--accent-yellow)';
        btnOverview.style.borderColor = 'var(--border-dark)';
        btnHistory.style.background = 'transparent';
        btnHistory.style.borderColor = 'transparent';
    } else {
        overviewSec.style.display = 'none';
        historySec.classList.remove('hidden');
        btnHistory.style.background = 'var(--accent-yellow)';
        btnHistory.style.borderColor = 'var(--border-dark)';
        btnOverview.style.background = 'transparent';
        btnOverview.style.borderColor = 'transparent';
    }
}
// Profile Action Handlers


function resetPasswordFromProfile() {
  openAuthModal('reset');
  switchAuthTab('reset');

    alert("A password reset link has been sent to your registered email address.");
}

async function deleteAccount() {
  if (!confirm('Are you sure? This cannot be undone.')) return;

  try {
    const response = await fetch('/api/user', {
      method: 'DELETE',
      credentials: 'include'
    });

    if (response.ok) {
      showToastCard('Account deleted');
      localStorage.clear();
      setTimeout(() => window.location.reload(), 1500);
    } else {
      const data = await response.json().catch(() => ({}));
      showToastCard('❌ ' + (data.error || 'Failed to delete'));
    }
  } catch (err) {
    showToastCard('❌ Network error');
  }
}

function switchTheme(theme) {
    const btns = document.querySelectorAll('.theme-btn');
    btns.forEach(btn => btn.classList.remove('active'));

    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        if (event && event.target) event.target.classList.add('active');
    } else {
        document.body.classList.remove('dark-theme');
        if (event && event.target) event.target.classList.add('active');
    }
}

function openAuthModal(tab) {
    const authScr = document.getElementById('authScreen');
    if (authScr) authScr.classList.remove('hidden');
    switchAuthTab(tab);
}

function closeAuthModal() {
    const authScr = document.getElementById('authScreen');
    if (authScr) authScr.classList.add('hidden');
}

// 
// ==========================================================================
// EDIT PROFILE MODAL
// ==========================================================================

function editProfile() {
    // 1. 先用后端数据填充表单
    fetch('/api/user', { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(user => {
            const nameEl = document.getElementById('editUsername');
            const emailEl = document.getElementById('editEmail');
            const bdayEl = document.getElementById('editBirthday');
            const genderEl = document.getElementById('editGender');
            const bioEl = document.getElementById('editBio');

            if (nameEl) nameEl.value = user.username || '';
            if (emailEl) emailEl.value = user.email || '';

            // birthday 后端存的是 "01/01/2000" 格式，转成 "2000-01-01" 给 date input
            if (bdayEl && user.birthday) {
                const parts = user.birthday.split('/');
                if (parts.length === 3) {
                    bdayEl.value = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                }
            }

            if (genderEl) genderEl.value = user.gender || '';
            if (bioEl) bioEl.value = user.bio || '';

            // 显示模态框
            const modal = document.getElementById('editProfileModal');
            if (modal) modal.classList.remove('hidden');
            if (window.lucide) lucide.createIcons();
        })
        .catch(err => {
            console.error('editProfile fetch error:', err);
            showToastCard('❌ Could not load profile');
        });
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.classList.add('hidden');
}

async function saveProfileChanges(event) {
    event.preventDefault();

    const username = document.getElementById('editUsername')?.value.trim();
    const email = document.getElementById('editEmail')?.value.trim();
    const birthdayRaw = document.getElementById('editBirthday')?.value;   // "2000-01-01"
    const gender = document.getElementById('editGender')?.value;
    const bio = document.getElementById('editBio')?.value.trim();

    if (!username || !email) {
        showToastCard('Username and email are required');
        return;
    }

    
    let birthday = '';
    if (birthdayRaw) {
        const [y, m, d] = birthdayRaw.split('-');
        birthday = `${d}/${m}/${y}`;
    }

    const payload = { username, email, birthday, gender, bio };

    try {
        const response = await fetch('/api/user', {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            showToastCard('✅ Profile updated');
            closeEditProfileModal();

            
            await loadUserProfileDetails();

            
            const userDisp = document.getElementById('userDisplayName');
            if (userDisp) userDisp.textContent = username;

        } else {
            showToastCard('❌ ' + (data.error || 'Failed to save'));
        }
    } catch (err) {
        console.error('saveProfileChanges error:', err);
        showToastCard('❌ Network error');
    }
}
// ==========================================================================
// HISTORY VIEW — List / Cards 
// ==========================================================================

let historyStyle = 'list';   // 'list' | 'cards'

function setHistoryStyle(style) {
    historyStyle = style;
    console.log('🔁 setHistoryStyle:', style, '| logs:', moodLogs.length);

    // 切换按钮高亮
    document.querySelectorAll('.history-style-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.style === style);
    });

    // 切换容器显示
    const listBox = document.getElementById('historyListContainer');
    const cardsBox = document.getElementById('historyCardsContainer');

    if (listBox) listBox.classList.toggle('hidden', style !== 'list');
    if (cardsBox) cardsBox.classList.toggle('hidden', style !== 'cards');

    // 渲染
    renderHistoryView();
}

function renderHistoryView() {
    if (!Array.isArray(moodLogs)) moodLogs = [];

    if (historyStyle === 'list') {
        renderHistoryList(moodLogs);
    } else {
        renderHistoryCards(moodLogs);
    }
}

// ============ LIST 模式 ============
function renderHistoryList(arr) {
    const tbody = document.getElementById('history-list-body');
    if (!tbody) {
        console.warn('❌ #history-list-body 不存在');
        return;
    }

    if (arr.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:1.5rem 0;">No logs yet. Go to Dashboard to log your first mood!</td></tr>`;
        return;
    }

    tbody.innerHTML = arr.map(log => `
        <tr>
            <td>${log.log_date}</td>
            <td>
                <span class="badge-emotion" style="background:${getEmotionBg(log.emotion)}">
                    <i data-lucide="${log.iconName || 'smile'}" style="width:14px;"></i> ${log.emotion}
                </span>
            </td>
            <td style="color:var(--text-muted);">${log.note || '—'}</td>
            <td>
                <button class="btn-delete" onclick="deleteLog(${log.id})">
                    <i data-lucide="trash-2" style="width:14px;"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

// ============ CARDS 模式 ============
function renderHistoryCards(arr) {
    const container = document.getElementById('history-cards-body');
    if (!container) {
        console.warn('❌ #history-cards-body 不存在');
        return;
    }

    if (arr.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted);font-weight:600;">No mood entries logged yet.</p>`;
        return;
    }

    // 按日期分组
    const byDate = {};
    arr.forEach(l => {
        if (!byDate[l.log_date]) byDate[l.log_date] = [];
        byDate[l.log_date].push(l);
    });

    const dates = Object.keys(byDate).sort().reverse();

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;">
            ${dates.map(date => {
                const entries = byDate[date];
                const total = entries.length;

                const counts = {};
                entries.forEach(e => counts[e.emotion] = (counts[e.emotion] || 0) + 1);
                const dominant = Object.keys(counts).reduce((a, b) =>
                    counts[a] > counts[b] ? a : (counts[a] === counts[b] ? a : b));

                const dominantIcon = EMOTION_ICON_MAP[dominant] || 'smile';
                const dominantBg = getEmotionBg(dominant);

                return `
                    <div style="background:white;border:2px solid var(--border-dark);padding:1rem;border-radius:16px;box-shadow:2px 2px 0 var(--border-dark);position:relative;">
                        <div style="font-size:0.75rem;font-weight:800;color:var(--text-muted);margin-bottom:0.4rem;">${date}</div>
                        <div style="display:flex;align-items:center;gap:6px;font-weight:800;font-size:0.95rem;background:${dominantBg};padding:4px 10px;border-radius:10px;border:1.5px solid var(--border-dark);width:fit-content;">
                            <i data-lucide="${dominantIcon}" style="width:14px;"></i> ${dominant}
                        </div>
                        ${entries[0].note ? `<div style="font-size:0.75rem;color:var(--text-dark);opacity:0.75;margin-top:0.6rem;">${entries[0].note}</div>` : ''}
                        ${total > 1 ? `<span style="position:absolute;top:8px;right:8px;background:#ff6b6b;color:white;font-size:0.65rem;padding:2px 7px;border-radius:8px;font-weight:800;">${total}</span>` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}


function addAlarm(event) {
    if (event) event.preventDefault();
    const timeInput = document.getElementById('alarmTimeInput');
    const labelInput = document.getElementById('alarmLabelInput');
    if (!timeInput || !timeInput.value) return showToastCard('Please select a time');
    const alarmData = {
        id: Date.now(),
        time: timeInput.value,
        label: (labelInput?.value || '').trim() || 'Alarm',
        enabled: true
    };
    const alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
    alarms.push(alarmData);
    localStorage.setItem('alarms', JSON.stringify(alarms));
    timeInput.value = '';
    if (labelInput) labelInput.value = '';
    renderAlarms();
    showToastCard('⏰ Alarm added!');
}

function renderAlarms() {
    const list = document.getElementById('alarmListContainer');
    if (!list) return;
    const alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
    if (alarms.length === 0) {
        list.innerHTML = `<li><span>No alarms set. Use the form below to add one.</span></li>`;
        return;
    }
    list.innerHTML = alarms.map(a => `
        <li>
            <div><strong>${a.time}</strong> — <span>${a.label}</span></div>
            <button class="btn-delete" onclick="deleteAlarm(${a.id})" title="Delete">
                <i data-lucide="trash-2" style="width:14px;"></i>
            </button>
        </li>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function deleteAlarm(id) {
    let alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
    alarms = alarms.filter(a => a.id !== id);
    localStorage.setItem('alarms', JSON.stringify(alarms));
    renderAlarms();
    showToastCard('Alarm removed.');
}

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(renderAlarms, 100);
});
