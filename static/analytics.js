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

