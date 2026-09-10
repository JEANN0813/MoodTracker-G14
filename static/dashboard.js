

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

// Chart instances
let emotionChart = null;
let moodHistoryChart = null;

// FETCH USER DATA

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
                document.getElementById('username-display').innerText =
                    data.username;
            }
        })
        .catch(err => {
            console.error('User data error:', err);
        });
}

// FETCH STATISTICS

function fetchStats() {

    fetch('/api/stats?days=30')
        .then(res => res.json())
        .then(data => {

            const stats = data.statistics || [];
            const total = data.total || 0;

            // ----------------------------------------------------
            // Total logs
            // ----------------------------------------------------

            document.getElementById('stat-total').innerText = total;


            // ----------------------------------------------------
            // Emotion breakdown
            // ----------------------------------------------------

            let anxious = 0;
            let happy = 0;
            let neutral = 0;
            let sad = 0;
            let calm = 0;

            stats.forEach(item => {

                switch (item.emotion) {

                    case 'Happy':
                        happy += item.count;
                        break;

                    case 'Sad':
                        sad += item.count;
                        break;

                    case 'Anxious':
                        anxious += item.count;
                        break;

                    case 'Calm':
                        calm += item.count;
                        break;

                    default:
                        neutral += item.count;
                        break;
                }
            });


            // Update dashboard statistics

            document.getElementById('stat-anxious').innerText =
                anxious + sad;

            document.getElementById('stat-happy').innerText =
                happy;

            document.getElementById('stat-neutral').innerText =
                neutral + calm;

            // WEEKLY STATISTICS

            fetchWeeklyStats();

            // EMOTION PERCENTAGES

            updateEmotionPercentages(
                happy,
                sad,
                anxious,
                neutral,
                calm,
                total
            );


            // MOOD SCORE

            const moodScore = calculateMoodScore(stats);

            const moodScoreElement =
                document.getElementById('mood-score');

            if (moodScoreElement) {
                moodScoreElement.innerText =
                    moodScore + '/100';
            }

            // TREND ANALYSIS

            updateTrendAnalysis(data);


            // EMOTION DISTRIBUTION CHART

            createEmotionChart(
                happy,
                sad,
                anxious,
                neutral,
                calm
            );


            // RULE-BASED INSIGHTS

            updateInsights(data);

        })
        .catch(err => {
            console.error('Stats error:', err);
        });
}


// WEEKLY STATISTICS

function fetchWeeklyStats() {

    fetch('/api/stats?days=7')
        .then(res => res.json())
        .then(data => {

            const stats = data.statistics || [];

            let happy = 0;
            let sad = 0;
            let anxious = 0;
            let neutral = 0;
            let calm = 0;

            stats.forEach(item => {

                switch (item.emotion) {

                    case 'Happy':
                        happy += item.count;
                        break;

                    case 'Sad':
                        sad += item.count;
                        break;

                    case 'Anxious':
                        anxious += item.count;
                        break;

                    case 'Calm':
                        calm += item.count;
                        break;

                    default:
                        neutral += item.count;
                        break;
                }
            });


            // Update weekly elements if they exist

            const weeklyHappy =
                document.getElementById('weekly-happy');

            const weeklyAnxious =
                document.getElementById('weekly-anxious');

            const weeklySad =
                document.getElementById('weekly-sad');

            const weeklyNeutral =
                document.getElementById('weekly-neutral');


            if (weeklyHappy)
                weeklyHappy.innerText = happy;

            if (weeklyAnxious)
                weeklyAnxious.innerText = anxious;

            if (weeklySad)
                weeklySad.innerText = sad;

            if (weeklyNeutral)
                weeklyNeutral.innerText =
                    neutral + calm;

        })
        .catch(err => {
            console.error('Weekly stats error:', err);
        });
}

// 2. EMOTION PERCENTAGES

function updateEmotionPercentages(
    happy,
    sad,
    anxious,
    neutral,
    calm,
    total
) {

    if (total === 0) {
        return;
    }

    const percentages = {

        happy: Math.round((happy / total) * 100),

        sad: Math.round((sad / total) * 100),

        anxious: Math.round((anxious / total) * 100),

        neutral: Math.round((neutral / total) * 100),

        calm: Math.round((calm / total) * 100)
    };


    // Update percentage elements if they exist

    const happyElement =
        document.getElementById('percentage-happy');

    const sadElement =
        document.getElementById('percentage-sad');

    const anxiousElement =
        document.getElementById('percentage-anxious');

    const neutralElement =
        document.getElementById('percentage-neutral');

    const calmElement =
        document.getElementById('percentage-calm');


    if (happyElement)
        happyElement.innerText =
            percentages.happy + '%';

    if (sadElement)
        sadElement.innerText =
            percentages.sad + '%';

    if (anxiousElement)
        anxiousElement.innerText =
            percentages.anxious + '%';

    if (neutralElement)
        neutralElement.innerText =
            percentages.neutral + '%';

    if (calmElement)
        calmElement.innerText =
            percentages.calm + '%';
}


// 3. MOOD SCORE

function calculateMoodScore(stats) {

    let score = 50;


    stats.forEach(item => {

        switch (item.emotion) {

            case 'Happy':
                score += item.count * 5;
                break;

            case 'Calm':
                score += item.count * 3;
                break;

            case 'Sad':
                score -= item.count * 5;
                break;

            case 'Anxious':
                score -= item.count * 4;
                break;

            case 'Neutral':
                score += 0;
                break;
        }
    });


    // Keep score between 0 and 100

    score = Math.max(0, Math.min(100, score));

    return score;
}


// MOOD SCORE DESCRIPTION

function getMoodScoreDescription(score) {

    if (score >= 80) {
        return '😊 Excellent mood';
    }

    if (score >= 65) {
        return '🙂 Positive mood';
    }

    if (score >= 45) {
        return '😐 Stable mood';
    }

    if (score >= 30) {
        return '😟 Low mood';
    }

    return '😔 Very low mood';
}

// 4. BETTER TREND ANALYSIS

function updateTrendAnalysis(data) {

    const trendElement =
        document.getElementById('insight-trend');

    if (!trendElement) {
        return;
    }


    /*
     * The backend may provide daily statistics.
     * If it does not, we use the available emotion
     * statistics as a fallback.
     */

    const stats = data.statistics || [];


    let happy = 0;
    let negative = 0;

    stats.forEach(item => {

        if (item.emotion === 'Happy' ||
            item.emotion === 'Calm') {

            happy += item.count;

        }

        if (item.emotion === 'Sad' ||
            item.emotion === 'Anxious') {

            negative += item.count;
        }
    });


    if (happy > negative * 1.5) {

        trendElement.innerText =
            '↗️ Your overall mood appears positive. Keep it up!';

        trendElement.style.color =
            '#27ae60';

    } else if (negative > happy * 1.5) {

        trendElement.innerText =
            '↘️ You have experienced more negative emotions recently. Consider taking some time to relax or talk to someone you trust.';

        trendElement.style.color =
            '#e74c3c';

    } else {

        trendElement.innerText =
            '➡️ Your mood appears relatively stable.';

        trendElement.style.color =
            '#555';
    }
}


// 5. EMOTION DISTRIBUTION CHART

function createEmotionChart(
    happy,
    sad,
    anxious,
    neutral,
    calm
) {

    const canvas =
        document.getElementById('emotionChart');

    if (!canvas) {
        return;
    }


    // Destroy old chart before creating a new one

    if (emotionChart) {
        emotionChart.destroy();
    }


    emotionChart = new Chart(canvas, {

        type: 'doughnut',

        data: {

            labels: [
                'Happy',
                'Sad',
                'Anxious',
                'Neutral',
                'Calm'
            ],

            datasets: [{

                data: [
                    happy,
                    sad,
                    anxious,
                    neutral,
                    calm
                ],

                borderWidth: 1
            }]
        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    position: 'bottom'
                },

                title: {
                    display: true,
                    text: 'Emotion Distribution'
                }
            }
        }
    });
}

// 6. MOOD HISTORY CHART

function fetchMoodHistory() {

    fetch('/api/logs')
        .then(res => res.json())
        .then(data => {

            if (!data.logs ||
                data.logs.length === 0) {

                return;
            }


            const logs =
                data.logs.slice(0, 30).reverse();


            const labels = [];
            const scores = [];


            logs.forEach(log => {

                labels.push(log.log_date);

                let score = 50;


                switch (log.emotion) {

                    case 'Happy':
                        score = 90;
                        break;

                    case 'Calm':
                        score = 75;
                        break;

                    case 'Neutral':
                        score = 50;
                        break;

                    case 'Anxious':
                        score = 30;
                        break;

                    case 'Sad':
                        score = 20;
                        break;
                }


                scores.push(score);
            });


            createMoodHistoryChart(
                labels,
                scores
            );

        })
        .catch(err => {
            console.error(
                'Mood history error:',
                err
            );
        });
}

// CREATE MOOD HISTORY CHART

function createMoodHistoryChart(
    labels,
    scores
) {

    const canvas =
        document.getElementById(
            'moodHistoryChart'
        );

    if (!canvas) {
        return;
    }


    if (moodHistoryChart) {
        moodHistoryChart.destroy();
    }


    moodHistoryChart = new Chart(canvas, {

        type: 'line',

        data: {

            labels: labels,

            datasets: [{

                label: 'Mood Score',

                data: scores,

                tension: 0.3,

                fill: false,

                borderWidth: 2,

                pointRadius: 4
            }]
        },

        options: {

            responsive: true,

            scales: {

                y: {

                    min: 0,

                    max: 100,

                    title: {
                        display: true,
                        text: 'Mood'
                    }
                }
            },

            plugins: {

                legend: {
                    display: false
                },

                title: {
                    display: true,
                    text: 'Mood History'
                }
            }
        }
    });
}

// 7. RULE-BASED INSIGHTS

function updateInsights(data) {

    const stats =
        data.statistics || [];


    if (stats.length === 0) {

        const element =
            document.getElementById(
                'insight-most-common'
            );

        if (element) {
            element.innerText =
                'No data yet';
        }

        return;
    }

    // Most common emotion

    const top =
        stats.reduce((a, b) =>
            a.count > b.count ? a : b
        );


    const emotionNames = {

        'Happy': '😊 Happy',

        'Sad': '😢 Sad',

        'Anxious': '😰 Anxious',

        'Neutral': '😐 Neutral',

        'Calm': '😌 Calm'
    };


    const mostCommonElement =
        document.getElementById(
            'insight-most-common'
        );


    if (mostCommonElement) {

        mostCommonElement.innerText =
            emotionNames[top.emotion] ||
            top.emotion;
    }


    // Additional insights

    const happy =
        stats.find(s =>
            s.emotion === 'Happy'
        );

    const sad =
        stats.find(s =>
            s.emotion === 'Sad'
        );

    const anxious =
        stats.find(s =>
            s.emotion === 'Anxious'
        );

    const calm =
        stats.find(s =>
            s.emotion === 'Calm'
        );


    const insights = [];


    // Positive emotion insight

    if (happy && happy.count >= 5) {

        insights.push(
            '😊 You have recorded several happy moments this month.'
        );
    }


    // Anxiety insight

    if (anxious && anxious.count >= 4) {

        insights.push(
            '😰 Anxiety appears regularly in your entries. Consider identifying situations that may be contributing to it.'
        );
    }


    // Sadness insight

    if (sad && sad.count >= 4) {

        insights.push(
            '😢 You have recorded several sad entries recently. Taking time to reflect or speaking with someone you trust may help.'
        );
    }


    // Calm insight

    if (calm && calm.count >= 5) {

        insights.push(
            '😌 You have recorded many calm moments. This may indicate that activities helping you relax are working well.'
        );
    }


    // Positive balance

    const happyCount =
        happy ? happy.count : 0;

    const calmCount =
        calm ? calm.count : 0;

    const sadCount =
        sad ? sad.count : 0;

    const anxiousCount =
        anxious ? anxious.count : 0;


    if ((happyCount + calmCount) >
        (sadCount + anxiousCount)) {

        insights.push(
            '📈 Overall, your positive emotions currently outweigh your negative emotions.'
        );
    }

    // Display additional insights

    const insightContainer =
        document.getElementById(
            'additional-insights'
        );


    if (insightContainer) {

        if (insights.length === 0) {

            insightContainer.innerHTML =
                '<p class="text-muted">Keep logging your emotions to receive personalized insights.</p>';

        } else {

            insightContainer.innerHTML =
                insights
                    .map(insight =>
                        `<p>${insight}</p>`
                    )
                    .join('');
        }
    }
}

// FETCH RECENT LOGS

function fetchLogs() {

    fetch('/api/logs')
        .then(res => res.json())
        .then(data => {

            const tbody =
                document.getElementById(
                    'logs-table-body'
                );


            if (!data.logs ||
                data.logs.length === 0) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="4"
                            class="text-center text-muted">

                            No entries logged yet.
                            Write your first reflection above!

                        </td>
                    </tr>`;

                return;
            }


            tbody.innerHTML =
                data.logs
                    .slice(0, 10)
                    .map(log => `

                <tr>

                    <td class="fw-semibold">
                        ${log.log_date}
                    </td>

                    <td>
                        <span class="badge ${getEmotionBadge(log.emotion)}">
                            ${log.emotion}
                        </span>
                    </td>

                    <td class="text-muted">
                        ${log.note || '-'}
                    </td>

                    <td>

                        <button
                            class="btn btn-sm btn-outline-danger"
                            onclick="deleteLog(${log.id})">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </td>

                </tr>

            `)
                    .join('');
        })
        .catch(err => {

            console.error(
                'Logs error:',
                err
            );

        });
}

// EMOTION BADGE

function getEmotionBadge(emotion) {

    if (emotion === 'Happy')
        return 'bg-success';

    if (emotion === 'Anxious' ||
        emotion === 'Sad')
        return 'bg-warning text-dark';

    if (emotion === 'Calm')
        return 'bg-info';

    return 'bg-secondary';
}

// DELETE LOG

function deleteLog(id) {

    if (!confirm(
        'Are you sure you want to delete this log?'
    )) {
        return;
    }


    fetch(`/api/logs/${id}`, {

        method: 'DELETE'

    })
        .then(res => res.json())
        .then(() => {

            fetchStats();

            fetchLogs();

            fetchMoodHistory();

            fetchCalendar();

        })
        .catch(err => {

            alert(
                'Error deleting log: ' +
                err.message
            );

        });
}


// LOGOUT

function logout() {

    fetch('/api/logout', {

        method: 'POST'

    })
        .then(() => {

            window.location.href =
                '/index.html';

        })
        .catch(() => {

            window.location.href =
                '/index.html';

        });
}

// INITIALIZE DASHBOARD

document.addEventListener(
    'DOMContentLoaded',
    function () {

        fetchUserData();

        fetchStats();

        fetchLogs();

        fetchMoodHistory();

    }
);


/// AYA JAVASCRIPT

    // STATE & LOCAL STORAGE DATA
    let activeUser = "Mara";
    let selectedEmotion = null;
    let selectedIcon = "";
    let currentDate = new Date(2026, 8, 1);
    let activeTargetDate = new Date().toISOString().split('T')[0];

    let moodLogs = [
        { id: 1, log_date: "2026-09-05", emotion: "Happy", iconName: "smile", note: "Finished the assignment step on time!" },
        { id: 2, log_date: "2026-09-04", emotion: "Calm", iconName: "sun", note: "Relaxing evening read." }
    ];

    // SPLASH TRANSITION TIMER
    document.addEventListener("DOMContentLoaded", () => {
        const splash = document.getElementById("welcomeSplash");
        setTimeout(() => {
            splash.classList.add("hidden-splash");
        }, 2000);
        refreshUI();
    });

    // AUTH TAB SWITCHER
    function switchAuthTab(tab) {
        document.getElementById('authViewLogin').classList.add('hidden');
        document.getElementById('authViewRegister').classList.add('hidden');
        document.getElementById('authViewReset').classList.add('hidden');

        const tabHeader = document.getElementById('authTabsHeader');
        tabHeader.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));

        if (tab === 'login') {
            document.getElementById('authViewLogin').classList.remove('hidden');
            tabHeader.children[0].classList.add('active');
        } else if (tab === 'register') {
            document.getElementById('authViewRegister').classList.remove('hidden');
            tabHeader.children[1].classList.add('active');
        } else if (tab === 'reset') {
            document.getElementById('authViewReset').classList.remove('hidden');
            tabHeader.children[2].classList.add('active');
        }
        lucide.createIcons();
    }

    // AUTH SUBMISSIONS
    function handleAuthSubmit(e, userName) {
        e.preventDefault();
        activeUser = userName || "Mara";
        enterSanctuary();
    }

    function handleRegisterSubmit(e) {
        e.preventDefault();
        const inputName = document.getElementById('regFullName').value.trim();
        if (inputName) activeUser = inputName;
        enterSanctuary();
    }

    function enterSanctuary() {
        document.getElementById('userDisplayName').innerText = activeUser;
        document.getElementById('profileUserText').innerText = `Active User: ${activeUser}`;
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('appLayout').classList.remove('hidden');
        refreshUI();
    }

    function logout() {
        document.getElementById('appLayout').classList.add('hidden');
        document.getElementById('authScreen').classList.remove('hidden');
    }

    // NAVIGATION
    function switchView(viewId, element) {
        document.getElementById('dashboardView').classList.add('hidden');
        document.getElementById('calendarView').classList.add('hidden');
        document.getElementById('profileView').classList.add('hidden');

        document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
        document.getElementById(viewId).classList.remove('hidden');
        element.classList.add('active');

        if (viewId === 'calendarView') {
            renderStandaloneCalendar();
        }
    }

    // MOOD SELECTION & LOGGING
    function selectEmotion(btn, emotion, iconName) {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedEmotion = emotion;
        selectedIcon = iconName;
    }

    function logMood() {
        const noteText = document.getElementById('moodNote').value.trim();

        if (!selectedEmotion) {
            showToastCard("Please select an emotion icon first!");
            return;
        }

        moodLogs = moodLogs.filter(l => l.log_date !== activeTargetDate);

        const newEntry = {
            id: Date.now(),
            log_date: activeTargetDate,
            emotion: selectedEmotion,
            iconName: selectedIcon,
            note: noteText || "-"
        };

        moodLogs.unshift(newEntry);

        document.getElementById('moodNote').value = "";
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        selectedEmotion = null;
        selectedIcon = "";

        refreshUI();

        triggerSuccessFeedback(newEntry.id, activeTargetDate);
        showToastCard(`Mood successfully stamped for ${activeTargetDate}!`);
    }

    function triggerSuccessFeedback(entryId, dateStr) {
        const firstRow = document.querySelector('#logs-table-body tr');
        if (firstRow) {
            firstRow.style.transition = 'background-color 0.5s ease';
            firstRow.style.backgroundColor = 'var(--card-mint)';
            setTimeout(() => {
                firstRow.style.backgroundColor = 'transparent';
            }, 1200);
        }

        const selectedCell = document.querySelector(`.day-cell[data-date="${dateStr}"]`);
        if (selectedCell) {
            selectedCell.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            selectedCell.style.transform = 'scale(1.2)';
            setTimeout(() => {
                selectedCell.style.transform = 'scale(1)';
            }, 300);
        }
    }

    function deleteLog(id) {
        moodLogs = moodLogs.filter(log => log.id !== id);
        refreshUI();
    }

    function resetLoggingDateToToday() {
        activeTargetDate = new Date().toISOString().split('T')[0];
        refreshUI();
    }

    // UI REFRESH & STATS
    function refreshUI() {
        document.getElementById('loggingDateDisplay').innerText = activeTargetDate;
        document.getElementById('selectedTargetDateLabel').innerText = activeTargetDate;
        
        renderTable();
        calculateStats();
        generateCalendar();
        lucide.createIcons();
    }

    function renderTable() {
        const tbody = document.getElementById('logs-table-body');
        if (moodLogs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">No logs yet. Select an emotion above to stamp your day!</td></tr>`;
            return;
        }

        tbody.innerHTML = moodLogs.slice(0, 8).map(log => `
            <tr>
                <td>${log.log_date}</td>
                <td>
                    <span class="badge-emotion" style="background: ${getEmotionBg(log.emotion)}">
                        <i data-lucide="${log.iconName}" style="width: 14px;"></i> ${log.emotion}
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
        document.getElementById('stat-total').innerText = moodLogs.length;

        let happy = 0, anxious = 0, neutral = 0;
        moodLogs.forEach(l => {
            if (l.emotion === 'Happy' || l.emotion === 'Calm') happy++;
            else if (l.emotion === 'Anxious' || l.emotion === 'Sad') anxious++;
            else neutral++;
        });

        document.getElementById('stat-happy').innerText = happy;
        document.getElementById('stat-anxious').innerText = anxious;
        document.getElementById('stat-neutral').innerText = neutral;

        if (moodLogs.length > 0) {
            const latest = moodLogs[0];
            document.getElementById('insight-most-common').innerHTML = `<i data-lucide="${latest.iconName}" style="width: 18px;"></i> ${latest.emotion}`;
            
            if (happy >= anxious && happy >= neutral) {
                document.getElementById('insight-overall').innerHTML = `Positive <i data-lucide="smile" style="width: 22px;"></i>`;
                document.getElementById('insight-desc').innerText = "Your logs reflect high resilience and overall brightness.";
            } else if (anxious > happy) {
                document.getElementById('insight-overall').innerHTML = `Needs Care <i data-lucide="frown" style="width: 22px;"></i>`;
                document.getElementById('insight-desc').innerText = "Higher anxiety/stress detected. Consider taking small breaks.";
            } else {
                document.getElementById('insight-overall').innerHTML = `Balanced <i data-lucide="meh" style="width: 22px;"></i>`;
                document.getElementById('insight-desc').innerText = "Your state is steady and reflective.";
            }
        } else {
            document.getElementById('insight-most-common').innerText = "None yet";
        }
    }

    // CALENDAR
    function generateCalendar() {
        const calendarGrid = document.getElementById("calendarDays");
        if (!calendarGrid) return;

        calendarGrid.innerHTML = "";
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById("monthYear").innerText = `${monthNames[month]} ${year}`;

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
            if (day === 6 && month === 8) dayCell.classList.add("today");

            const logged = moodLogs.find(l => l.log_date === dateStr);

            dayCell.innerHTML = `<span>${day}</span>${logged ? `<span class="day-mood-icon"><i data-lucide="${logged.iconName}" style="width: 14px;"></i></span>` : ''}`;
            
            dayCell.onclick = () => openDayDetailModal(dateStr, logged);
            calendarGrid.appendChild(dayCell);
        }
    }

    function renderStandaloneCalendar() {
        const container = document.getElementById('standaloneCalendarContainer');
        container.innerHTML = `
            <div style="padding: 1.5rem; background: var(--canvas-bg); border: 2px solid var(--border-dark); border-radius: 20px;">
                <h3 style="margin-bottom: 1rem;">Calendar Logs Overview</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem;">
                    ${moodLogs.map(l => `
                        <div style="background: white; border: 2px solid var(--border-dark); padding: 1rem; border-radius: 16px; box-shadow: 2px 2px 0px var(--border-dark);">
                            <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted);">${l.log_date}</div>
                            <div style="font-size: 1rem; font-weight: 800; margin: 0.4rem 0; display: flex; align-items: center; gap: 6px;">
                                <i data-lucide="${l.iconName}" style="width: 16px;"></i> ${l.emotion}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-dark); opacity: 0.8;">${l.note}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    function previousMonth() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        refreshUI();
    }

    function nextMonth() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        refreshUI();
    }

    // POPUP MODALS
    function openDayDetailModal(dateStr, loggedEntry) {
        document.getElementById('dayModalDateTitle').innerText = dateStr;
        const contentDiv = document.getElementById('dayModalContent');
        const actionBtn = document.getElementById('dayModalActionBtn');

        if (loggedEntry) {
            contentDiv.innerHTML = `
                <div style="background: var(--sidebar-bg); border: 2px solid var(--border-dark); border-radius: 16px; padding: 1rem;">
                    <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.1rem; margin-bottom: 0.4rem;">
                        <i data-lucide="${loggedEntry.iconName}" style="width: 20px;"></i> ${loggedEntry.emotion}
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

        actionBtn.onclick = () => {
            activeTargetDate = dateStr;
            toggleDayDetailModal(false);
            refreshUI();
        };

        toggleDayDetailModal(true);
        lucide.createIcons();
    }

    function toggleDayDetailModal(show) {
        const modal = document.getElementById('dayDetailModal');
        if (show) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    }

    function toggleAssistantModal(show) {
        const modal = document.getElementById('assistantModal');
        if (show) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    }

    function handleChatKey(e) {
        if (e.key === 'Enter') sendChatMessage();
    }

    function sendChatMessage() {
        const input = document.getElementById('chatInput');
        const userMsg = input.value.trim();
        if (!userMsg) return;

        const chatHistory = document.getElementById('chatHistory');
        
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

        setTimeout(() => {
            toast.remove();
        }, 2500);
    }
        async function handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const messageDiv = document.getElementById('loginMessage');
        
        if (!messageDiv) {
          const form = document.querySelector('.auth-form');
          const newDiv = document.createElement('div');
          newDiv.id = 'loginMessage';
          newDiv.style.cssText = 'color: #e74c3c; font-size: 0.9rem; text-align: center; margin-top: 0.5rem;';
          form.appendChild(newDiv);
          }
          const msgDiv = document.getElementById('loginMessage') || messageDiv;
          msgDiv.textContent = '';
          msgDiv.style.color = '#e74c3c';

        if (!email || !password) {
            messageDiv.textContent = '❌ Please enter both email and password';
            return;
           }

        const submitBtn = document.querySelector('.btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳ Signing in...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/login', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json'
                },
                credentials: 'include',  
                body: JSON.stringify({
                    email: email,       
                    username: email,
                    password: password
                  })
              });
              
            
            const data = await response.json();

            if (data.success) {
                messageDiv.textContent = '✅ Login successful! Redirecting...';
                messageDiv.style.color = '#27ae60';
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1000);
            } else {
                messageDiv.textContent = '❌ ' + (data.error || 'Login failed');
            }
        } catch (error) {
            messageDiv.textContent = '❌ Network error. Make sure server is running.';
            console.error('Login error:', error);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async function showForgotPassword(event) {
        event.preventDefault();
        const email = prompt("Please enter your registered email address:");
        if (!email) return;

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: email })
            });
            const data = await response.json();

            if (response.ok) {
                const resetCode = prompt("Verification code generated!\n(For local development, your code is: " + data.reset_code + ")\n\nPlease enter the 6-digit verification code:", "");
                if (!resetCode) return;

                const newPassword = prompt("Please enter your new password:", "");
                if (!newPassword) return;

                const resetResponse = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, reset_code: resetCode, new_password: newPassword })
                });
                const resetData = await resetResponse.json();

                if (resetResponse.ok) {
                    alert('✅ Password reset successfully! Please log in with your new password.');
                } else {
                    alert('❌ Reset failed: ' + (resetData.error || 'Unknown error'));
                }
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('❌ Network error. Please check the console.');
        }
    }

    async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user', { credentials: 'include' });
        if (response.status === 200) {
            
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        console.log('Not logged in');
      }
    }
    async function handleRegister(event) {
      event.preventDefault();
    
      const firstName = document.getElementById('first-name').value.trim();
      const lastName = document.getElementById('last-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value.trim();
      const termsChecked = document.getElementById('terms-agree')?.checked;
      const messageDiv = document.getElementById('registerMessage');
    
      if (!messageDiv) {
        const form = document.querySelector('.auth-form');
        const newDiv = document.createElement('div');
        newDiv.id = 'registerMessage';
        newDiv.style.cssText = 'color: #e74c3c; font-size: 0.9rem; text-align: center; margin-top: 0.5rem;';
        form.appendChild(newDiv);
    }
      const msgDiv = document.getElementById('registerMessage') || messageDiv;
      msgDiv.textContent = '';
      msgDiv.style.color = '#e74c3c';
    
      if (!firstName || !lastName || !email || !password) {
        msgDiv.textContent = '❌ Please fill in all fields';
        return;
    }
    
      if (!termsChecked) {
        msgDiv.textContent = '❌ Please agree to Terms of Service';
        return;
    }
    
      const submitBtn = document.querySelector('.btn-primary');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '⏳ Creating account...';
      submitBtn.disabled = true;
    
      try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                username: firstName + lastName,
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            msgDiv.textContent = '✅ Registration successful! Redirecting to login...';
            msgDiv.style.color = '#27ae60';
            
            setTimeout(() => {
                window.location.href = ' /index.html';
            }, 1500);
        } else {
            msgDiv.textContent = '❌ ' + (data.error || 'Registration failed');
        }
    } catch (error) {
        msgDiv.textContent = '❌ Network error: ' + error.message;
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
} 



    document.addEventListener('DOMContentLoaded', function() {
  
    checkLoginStatus();
    
  
    const loginForm = document.querySelector('.auth-form');
    if (loginForm && !loginForm.hasAttribute('data-bound')) {
        loginForm.setAttribute('data-bound', 'true');
        loginForm.addEventListener('submit', handleLogin);
    }
    

    const registerForm = document.querySelector('.auth-form');
    if (registerForm && registerForm.id === 'registerForm') {
        registerForm.addEventListener('submit', handleRegister);
    }
});
    
