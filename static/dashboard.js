
// ==========================================
// 1. STATE & GLOBAL VARIABLES
// ==========================================
let activeUser = "User";
let activeUserId = null;
let selectedEmotion = null;
let selectedIcon = "";
let currentDate = new Date();
let activeTargetDate = new Date().toISOString().split('T')[0];

let moodLogs = JSON.parse(localStorage.getItem('moodLogs')) || [
    { id: 1, log_date: new Date().toISOString().split('T')[0], emotion: "Happy", iconName: "smile", note: "Welcome to your fresh sanctuary dashboard!" }
];

// ==========================================
// 2. AUTHENTICATION & TAB SWITCHING
// ==========================================
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
    const userDisp = document.getElementById('userDisplayName');
    const profileText = document.getElementById('profileUserText');
    const authScr = document.getElementById('authScreen');
    const appLay = document.getElementById('appLayout');

    if (userDisp) userDisp.innerText = activeUser;
    if (profileText) profileText.innerText = `Active User: ${activeUser}`;
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

// ==========================================
// 3. UI NAVIGATION & SELECTION
// ==========================================
function switchView(viewId, element) {
    const views = ['dashboardView', 'calendarView', 'profileView'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
    if (element) element.classList.add('active');

    if (viewId === 'calendarView') {
        renderStandaloneCalendar();
    }
    if (window.lucide) lucide.createIcons();
}

function selectEmotion(btn, emotion, iconName) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedEmotion = emotion;
    selectedIcon = iconName || 'smile';
}

// ==========================================
// 4. MOOD LOGGING & LOCAL DATA HANDLERS
// ==========================================
async function fetchLogsAndRefresh() {
    try {
        const response = await fetch('/api/logs', { method: 'GET' });
        if (response.ok) {
            const data = await response.json();
            moodLogs = (data.logs || []).map(log => ({
                ...log,
                iconName: EMOTION_ICON_MAP[log.emotion] || 'smile'
            }));
            refreshUI();
        } else if (response.status === 401) {
            logout();
        }
    } catch (err) {
        showToastCard('❌ Failed to load logs from server.');
    }
}

async function logMood() {
    const noteElem = document.getElementById("moodNote");
    const note = noteElem ? noteElem.value.trim() : "";

    if (!selectedEmotion) {
        showToastCard("Please select an emotion first!");
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
            if (noteElem) noteElem.value = "";
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

// ==========================================
// 5. CALENDAR LOGIC
// ==========================================
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

        const logged = moodLogs.find(l => l.log_date === dateStr);

        dayCell.innerHTML = `<span>${day}</span>${logged ? `<span class="day-mood-icon"><i data-lucide="${logged.iconName || 'smile'}" style="width: 14px;"></i></span>` : ''}`;
        
        dayCell.onclick = () => openDayDetailModal(dateStr, logged);
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

// ==========================================
// 6. REFRESH UI & STATS CALCULATIONS
// ==========================================
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

    let happy = 0, anxious = 0, neutral = 0;
    moodLogs.forEach(l => {
        if (l.emotion === 'Happy' || l.emotion === 'Calm') happy++;
        else if (l.emotion === 'Anxious' || l.emotion === 'Sad') anxious++;
        else neutral++;
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
        if (mostCommonElem) mostCommonElem.innerHTML = `<i data-lucide="${latest.iconName || 'smile'}" style="width: 18px;"></i> ${latest.emotion}`;
        
        if (happy >= anxious && happy >= neutral) {
            if (overallElem) overallElem.innerHTML = `Positive <i data-lucide="smile" style="width: 22px;"></i>`;
            if (descElem) descElem.innerText = "Your logs reflect high resilience and overall brightness.";
        } else if (anxious > happy) {
            if (overallElem) overallElem.innerHTML = `Needs Care <i data-lucide="frown" style="width: 22px;"></i>`;
            if (descElem) descElem.innerText = "Higher anxiety/stress detected. Consider taking small breaks.";
        } else {
            if (overallElem) overallElem.innerHTML = `Balanced <i data-lucide="meh" style="width: 22px;"></i>`;
            if (descElem) descElem.innerText = "Your state is steady and reflective.";
        }
    } else {
        if (mostCommonElem) mostCommonElem.innerText = "None yet";
    }
}

// ==========================================
// 7. MODALS & UTILITIES
// ==========================================
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

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const userMsg = input ? input.value.trim() : '';
    if (!userMsg) return;

    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerText = userMsg;
    chatHistory.appendChild(userBubble);

    input.value = '';
    chatHistory.scrollTop = chatHistory.scrollHeight;

    setTimeout(() => {
        const lower = userMsg.toLowerCase();
        let response = "";

        if (['sad', 'down', 'depressed', 'unhappy'].some(w => lower.includes(w))) {
            response = "I'm sorry you're feeling down. Remember that it's okay to take things slow today. Try writing down one small positive thing.";
        } else if (['anxious', 'stressed', 'worried', 'panic'].some(w => lower.includes(w))) {
            response = "Take a deep breath in for 4 seconds, hold for 4, and release for 4. You are completely safe right now.";
        } else if (['happy', 'great', 'good', 'awesome'].some(w => lower.includes(w))) {
            response = "That is wonderful to hear! Keep carrying that positive momentum through your day.";
        } else {
            response = "Thank you for sharing that with me. Every emotion you experience is valid and worth acknowledging.";
        }

        const botBubble = document.createElement('div');
        botBubble.className = 'chat-bubble assistant';
        botBubble.innerText = response;
        chatHistory.appendChild(botBubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 400);
}

function showToastCard(message) {
    const toast = document.createElement('div');
    toast.className = 'modal-card';
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: auto; padding: 1rem 1.5rem; z-index: 2000; background: var(--accent-yellow); font-weight: 800; font-size: 0.85rem; border: 2px solid var(--border-dark); box-shadow: 4px 4px 0px var(--border-dark);';
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => { toast.remove(); }, 2500);
}

// ==========================================
// 8. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async function () {
    const splash = document.getElementById("welcomeSplash");
    if (splash) {
        setTimeout(() => { splash.classList.add("hidden-splash"); }, 1500);
    }

    try {
        const response = await fetch('/api/user', { method: 'GET' });
        if (response.ok) {
            const user = await response.json();
            activeUser = user.username;
            activeUserId = user.id;
            enterSanctuary();
        } else {
            switchAuthTab('login');
        }
    } catch (err) {
        switchAuthTab('login');
    }
});