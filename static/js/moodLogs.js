// ==========================================
// AHMED RAYYAN
// ==========================================

function selectEmotion(btn, emotion, iconName) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedEmotion = emotion;
    selectedIcon = iconName || 'smile';
}

//  MOOD LOGGING & LOCAL DATA HANDLERS 
async function fetchLogsAndRefresh() {
    localStorage.setItem('moodLogs', JSON.stringify(moodLogs));
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

            updateMoodChart(moodLogs);

        } else if (response.status === 401) {
            logout();
        }

    } catch (err) {
        showToastCard('❌ Failed to load logs from server.');
    }
}

async function logMood() {
    const note = generateMoodNote(selectedEmotion);

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

function resetLoggingDateToToday() {
    activeTargetDate = new Date().toISOString().split('T')[0];
    refreshUI();
}

//  REFRESH UI & STATS CALCULATIONS 
function refreshUI() {
    const loggingDateDisp = document.getElementById('loggingDateDisplay');
    const selectedTargetLbl = document.getElementById('selectedTargetDateLabel');
    const dateLabel = document.getElementById('currentDateLabel');

    const options = { weekday: 'long', month: 'short', day: 'numeric' };

    if (dateLabel) {
        dateLabel.innerText =
            new Date().toLocaleDateString('en-US', options);
    }

    if (loggingDateDisp) {
        loggingDateDisp.innerText = activeTargetDate;
    }

    if (selectedTargetLbl) {
        selectedTargetLbl.innerText = activeTargetDate;
    }

    renderTable();
    calculateStats();
    generateCalendar();

    updateMoodChart(moodLogs);

    if (typeof renderHistoryView === 'function') {
        renderHistoryView();
    }

    if (window.lucide) {
        lucide.createIcons();
    }
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

    moodLogs.forEach(function (l) {
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



/**
 * Get the Monday of the current week.
 */
function getStartOfWeek(date = new Date()) {
    const result = new Date(date);

    // Sunday = 0, Monday = 1, ..., Saturday = 6
    const day = result.getDay();

    // Convert Sunday into 6 days after Monday
    const daysFromMonday = day === 0 ? 6 : day - 1;

    result.setDate(result.getDate() - daysFromMonday);
    result.setHours(0, 0, 0, 0);

    return result;
}

/**
 * Convert Date into YYYY-MM-DD.
 */
function formatChartDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/**
 * Calculate the average mood value for one day.
 *
 * Anxious = 0
 * Sad     = 1
 * Neutral = 2
 * Calm    = 3
 * Happy   = 4
 */
function calculateDailyOverallMood(logs) {

    if (!logs || logs.length === 0) {
        return null;
    }

    const validValues = logs
        .map(log => MOOD_VALUES[log.emotion])
        .filter(value => value !== undefined);

    if (validValues.length === 0) {
        return null;
    }

    const total = validValues.reduce(
        (sum, value) => sum + value,
        0
    );

    return total / validValues.length;
}


/**
 * monthly
 */
function getMonthlyMoodData(logs) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthlyData = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateString = formatChartDate(dateObj);

        const dailyLogs = logs.filter(log => log.log_date === dateString);
        const overallMood = calculateDailyOverallMood(dailyLogs);

        monthlyData.push({
            date: dateString,
            day: day,
            mood: overallMood,
            moodLabel: overallMood !== null
                ? MOOD_LABELS[Math.round(overallMood)]
                : null
        });
    }

    return monthlyData;
}

/**
 * Prepare and update the month mood chart.
 */

// MONTH MOOD CHART - CHART.JS  


let moodChartInstance = null;

function updateMoodChart(logs) {

    const monthlyData = getMonthlyMoodData(logs);
    const daysInMonth = monthlyData.length; 

    console.log("Monthly Mood Chart Data:", monthlyData);

    const canvas = document.getElementById("moodChart");

    if (!canvas) {
        console.log("Mood chart canvas not found.");
        return;
    }

    // Destroy the previous chart before creating a new one
    if (moodChartInstance) {
        moodChartInstance.destroy();
    }

    const labels = monthlyData.map(day => day.day);
    const moodValues = monthlyData.map(day => day.mood);

    moodChartInstance = new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Overall Mood",

                data: moodValues,

                borderWidth: 3,

                tension: 0.3,

                pointRadius: 5,

                pointHoverRadius: 7,

                spanGaps: false
            }]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            scales: {
                y: {
                    min: 0,
                    max: 4,

                    ticks: {
                        stepSize: 1,

                        callback: function (value) {
                            return MOOD_LABELS[value];
                        }
                    },

                    title: {
                        display: true,
                        text: "Mood"
                    }
                },

                x: {
                    title: {
                        display: true,
                        text: "Day of Month"
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10,
                        maxRotation: 0,
                        minRotation: 0
                    }
                }
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;

                            if (value === null || value === undefined) {
                                return "No mood logged";
                            }

                            const roundedMood = MOOD_LABELS[Math.round(value)];
                            return `${roundedMood} (${value.toFixed(2)})`;
                        }
                    }
                }
            }
        }
    });
}



// MOOD CHART — MONTHLY  


function setChartRange(range) {
    // Currently the chart only supports monthly view.
    chartRange = 'monthly';

    // Update active button
    document.querySelectorAll('.chart-range-btn').forEach(btn => {
        btn.classList.toggle(
            'active',
            btn.dataset.range === 'monthly'
        );
    });

    updateMoodChart(moodLogs);
}




//  MODALS & UTILITIES 

function openDayDetailModal(dateStr, loggedEntries) {
    const dateTitle = document.getElementById('dayModalDateTitle');
    if (dateTitle) dateTitle.innerText = dateStr;

    const contentDiv = document.getElementById('dayModalContent');
    const actionBtn = document.getElementById('dayModalActionBtn');


    let entries = [];
    if (Array.isArray(loggedEntries)) {
        entries = loggedEntries;
    } else if (loggedEntries) {
        entries = [loggedEntries];
    }


    if (contentDiv) {
        if (entries.length > 0) {

            contentDiv.innerHTML = entries.map(entry => `
                <div style="background: var(--sidebar-bg); border: 2px solid var(--border-dark); border-radius: 16px; padding: 1rem; margin-bottom: 0.8rem;">
                    <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.1rem; margin-bottom: 0.4rem;">
                        <i data-lucide="${entry.iconName || 'smile'}" style="width: 20px;"></i> ${entry.emotion}
                    </div>
                    <p style="font-size: 0.85rem; font-weight: 600; color: var(--text-dark);">
                        "${entry.note || 'No note'}"
                    </p>
                    ${entry.created_at ? `
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.4rem;">
                            🕐 ${new Date(entry.created_at).toLocaleTimeString()}
                        </p>
                    ` : ''}
                </div>
            `).join('');
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
            showToastCard(`Now logging for ${dateStr}`);
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



