// ReRay: Emotion Analysis & Smart Features
// Existing dashboard functions + Advanced Analytics
// Daily emotion limit: maximum 5 logs per day


// ============================================================
// FETCH USER DATA
// ============================================================

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

                const usernameElement =
                    document.getElementById('username-display');

                if (usernameElement) {

                    usernameElement.innerText =
                        data.username;
                }
            }

        })

        .catch(() => {});
}


// ============================================================
// FETCH BASIC STATS
// ============================================================

function fetchStats() {

    fetch('/api/stats?days=30')

        .then(res => res.json())

        .then(data => {

            const totalElement =
                document.getElementById('stat-total');

            if (totalElement) {

                totalElement.innerText =
                    data.total || 0;
            }


            // Existing emotion breakdown

            let anxious = 0;
            let happy = 0;
            let neutral = 0;


            (data.statistics || []).forEach(item => {

                if (
                    item.emotion === 'Anxious' ||
                    item.emotion === 'Sad'
                ) {

                    anxious += item.count;

                } else if (
                    item.emotion === 'Happy'
                ) {

                    happy += item.count;

                } else {

                    neutral += item.count;
                }

            });


            const anxiousElement =
                document.getElementById('stat-anxious');

            const happyElement =
                document.getElementById('stat-happy');

            const neutralElement =
                document.getElementById('stat-neutral');


            if (anxiousElement) {
                anxiousElement.innerText = anxious;
            }

            if (happyElement) {
                happyElement.innerText = happy;
            }

            if (neutralElement) {
                neutralElement.innerText = neutral;
            }


            updateInsights(data);

        })

        .catch(err => {

            console.error(
                'Stats error:',
                err
            );

        });
}


// ============================================================
// EXISTING INSIGHTS
// ============================================================

function updateInsights(data) {

    const stats =
        data.statistics || [];


    // --------------------------------------------------------
    // Most common emotion
    // --------------------------------------------------------

    if (stats.length > 0) {

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


        const element =
            document.getElementById(
                'insight-most-common'
            );


        if (element) {

            element.innerText =
                emotionNames[top.emotion] ||
                top.emotion;
        }
    }


    // --------------------------------------------------------
    // Existing trend analysis
    // --------------------------------------------------------

    const trendElement =
        document.getElementById(
            'insight-trend'
        );


    if (!trendElement) {
        return;
    }


    const happy =
        stats.find(
            s => s.emotion === 'Happy'
        );


    const sad =
        stats.find(
            s => s.emotion === 'Sad'
        );


    const anxious =
        stats.find(
            s => s.emotion === 'Anxious'
        );


    if (
        happy &&
        happy.count > 5 &&
        (!sad || sad.count < 3)
    ) {

        trendElement.innerText =
            'Your mood appears to be improving! Keep it up!';

        trendElement.style.color =
            '#27ae60';

    } else if (
        sad &&
        sad.count > 3
    ) {

        trendElement.innerText =
            'You seem to be feeling down lately. Consider talking to someone.';

        trendElement.style.color =
            '#e74c3c';

    } else {

        trendElement.innerText =
            '➡ Your mood is relatively stable.';

        trendElement.style.color =
            '#555';
    }
}


// ============================================================
// DAILY EMOTION LOG LIMIT
// ============================================================
//
// Maximum: 5 emotion logs per calendar day.
//
// IMPORTANT:
// - Logs are NOT deleted at midnight.
// - Old logs remain in the database/history.
// - The current log display only shows today's logs.
// - The counter resets when the calendar date changes.
// ============================================================

const DAILY_EMOTION_LIMIT = 5;


// ------------------------------------------------------------
// GET TODAY'S DATE
// ------------------------------------------------------------

function getTodayDate() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, '0');


    const day =
        String(
            today.getDate()
        ).padStart(2, '0');


    return `${year}-${month}-${day}`;
}


// ------------------------------------------------------------
// GET TODAY'S EMOTION COUNT
// ------------------------------------------------------------

function getTodayEmotionCount() {

    const today =
        getTodayDate();


    const storedDate =
        localStorage.getItem(
            'moodtracker_log_date'
        );


    const storedCount =
        parseInt(
            localStorage.getItem(
                'moodtracker_daily_count'
            ),
            10
        );


    // New day = reset local counter

    if (storedDate !== today) {

        localStorage.setItem(
            'moodtracker_log_date',
            today
        );


        localStorage.setItem(
            'moodtracker_daily_count',
            '0'
        );


        return 0;
    }


    return isNaN(storedCount)
        ? 0
        : storedCount;
}


// ------------------------------------------------------------
// CHECK WHETHER USER CAN LOG AN EMOTION
// ------------------------------------------------------------

function canLogEmotion() {

    const count =
        getTodayEmotionCount();


    if (
        count >= DAILY_EMOTION_LIMIT
    ) {

        alert(
            'You have reached the daily limit of 5 emotion logs. Your limit will reset at midnight.'
        );


        return false;
    }


    return true;
}


// ------------------------------------------------------------
// RECORD SUCCESSFUL EMOTION USE
// ------------------------------------------------------------

function recordEmotionUse() {

    const today =
        getTodayDate();


    let count =
        getTodayEmotionCount();


    count++;


    localStorage.setItem(
        'moodtracker_log_date',
        today
    );


    localStorage.setItem(
        'moodtracker_daily_count',
        count.toString()
    );


    updateDailyLimitDisplay();
}


// ------------------------------------------------------------
// GET REMAINING USES
// ------------------------------------------------------------

function getRemainingEmotionUses() {

    const count =
        getTodayEmotionCount();


    return Math.max(
        0,
        DAILY_EMOTION_LIMIT - count
    );
}


// ------------------------------------------------------------
// UPDATE DAILY LIMIT DISPLAY
// ------------------------------------------------------------

function updateDailyLimitDisplay() {

    const element =
        document.getElementById(
            'emotion-limit'
        );


    if (!element) {
        return;
    }


    const used =
        getTodayEmotionCount();


    const remaining =
        getRemainingEmotionUses();


    element.innerText =
        `${used}/${DAILY_EMOTION_LIMIT} emotion logs used today (${remaining} remaining)`;
}


// ------------------------------------------------------------
// AUTOMATIC MIDNIGHT CHECK
// ------------------------------------------------------------

function startDailyResetChecker() {

    setInterval(() => {

        const storedDate =
            localStorage.getItem(
                'moodtracker_log_date'
            );


        const today =
            getTodayDate();


        if (
            storedDate !== today
        ) {

            // Reset counter

            localStorage.setItem(
                'moodtracker_log_date',
                today
            );


            localStorage.setItem(
                'moodtracker_daily_count',
                '0'
            );


            // Update display

            updateDailyLimitDisplay();


            // Refresh today's visible logs

            fetchLogs();


            // Refresh analysis

            generateAnalysis();
        }


    }, 30000);
}


// ------------------------------------------------------------
// INITIALIZE DAILY LIMIT
// ------------------------------------------------------------

function initializeDailyLimit() {

    getTodayEmotionCount();

    updateDailyLimitDisplay();

    startDailyResetChecker();
}


// ============================================================
// FETCH LOGS
// ============================================================
//
// Only today's logs are displayed in the current log table.
// Previous logs remain in the database for history.
// ============================================================

function fetchLogs() {

    fetch('/api/logs')

        .then(res => res.json())

        .then(data => {

            const tbody =
                document.getElementById(
                    'logs-table-body'
                );


            if (!tbody) {
                return;
            }


            const today =
                getTodayDate();


            // Only show today's logs

            const todayLogs =
                (data.logs || []).filter(
                    log => {

                        // Handles YYYY-MM-DD values

                        return (
                            log.log_date &&
                            String(log.log_date)
                                .substring(0, 10) === today
                        );

                    }
                );


            if (
                todayLogs.length === 0
            ) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="4"
                            class="text-center text-muted">

                            No entries logged today.
                            Write your first reflection!

                        </td>
                    </tr>
                `;


                return;
            }


            tbody.innerHTML =
                todayLogs
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


// ============================================================
// SUBMIT EMOTION LOG
// ============================================================

function submitEmotionLog(
    emotion,
    note
) {

    // Check daily limit first

    if (!canLogEmotion()) {
        return;
    }


    fetch('/api/logs', {

        method: 'POST',

        headers: {

            'Content-Type':
                'application/json'

        },

        body: JSON.stringify({

            emotion: emotion,

            note: note

        })

    })

        .then(res => {

            if (!res.ok) {

                return res.json()

                    .then(data => {

                        throw new Error(
                            data.error ||
                            'Unable to create emotion log.'
                        );

                    });

            }


            return res.json();

        })

        .then(data => {

            // Only increase counter after
            // successful database insertion.

            recordEmotionUse();


            // Refresh dashboard

            fetchStats();

            fetchLogs();

            generateAnalysis();


            // fetchCalendar may not exist
            // on every page.

            if (
                typeof fetchCalendar ===
                'function'
            ) {

                fetchCalendar();
            }


            alert(
                'Emotion logged successfully!'
            );

        })

        .catch(err => {

            console.error(
                'Emotion logging error:',
                err
            );


            alert(
                'Error logging emotion: ' +
                err.message
            );

        });
}


// ============================================================
// EMOTION BADGE
// ============================================================

function getEmotionBadge(emotion) {

    if (
        emotion === 'Happy'
    ) {

        return 'bg-success';
    }


    if (
        emotion === 'Anxious' ||
        emotion === 'Sad'
    ) {

        return 'bg-warning text-dark';
    }


    return 'bg-secondary';
}


// ============================================================
// DELETE LOG
// ============================================================

function deleteLog(id) {

    if (
        !confirm(
            'Delete this log?'
        )
    ) {

        return;
    }


    fetch(`/api/logs/${id}`, {

        method: 'DELETE'

    })

        .then(res => res.json())

        .then(() => {

            fetchStats();

            fetchLogs();

            generateAnalysis();


            if (
                typeof fetchCalendar ===
                'function'
            ) {

                fetchCalendar();
            }

        })

        .catch(err => {

            alert(
                'Error deleting log: ' +
                err.message
            );

        });
}


// ============================================================
// ADVANCED ANALYTICS MODULE
// ============================================================
//
// Features:
// 1. Emotion frequency
// 2. Weekly trends
// 3. Unique emotion days
// 4. Rule-based feedback
// 5. Analysis report
// ============================================================

function generateAnalysis() {

    fetch('/api/logs')

        .then(res => res.json())

        .then(data => {

            const logs =
                data.logs || [];


            if (
                logs.length === 0
            ) {

                displayAnalysis({

                    message:
                        'Not enough data yet. Keep logging your emotions to receive personalized analysis.'

                });


                return;
            }


            // ------------------------------------------------
            // Count overall emotion frequencies
            // ------------------------------------------------

            const emotionCounts = {

                Happy: 0,
                Sad: 0,
                Anxious: 0,
                Neutral: 0,
                Calm: 0

            };


            logs.forEach(log => {

                if (
                    Object.prototype.hasOwnProperty.call(
                        emotionCounts,
                        log.emotion
                    )
                ) {

                    emotionCounts[
                        log.emotion
                    ]++;

                }

            });


            // ------------------------------------------------
            // Calculate current 7 calendar days
            // ------------------------------------------------

            const today =
                new Date();


            const todayString =
                getTodayDate();


            const sevenDaysAgo =
                new Date(today);


            sevenDaysAgo.setHours(
                0,
                0,
                0,
                0
            );


            sevenDaysAgo.setDate(
                today.getDate() - 6
            );


            // ------------------------------------------------
            // Filter weekly logs
            // ------------------------------------------------

            const weeklyLogs =
                logs.filter(log => {

                    if (!log.log_date) {
                        return false;
                    }


                    const dateString =
                        String(log.log_date)
                            .substring(0, 10);


                    const logDate =
                        new Date(
                            dateString + 'T00:00:00'
                        );


                    return (
                        logDate >= sevenDaysAgo &&
                        dateString <= todayString
                    );

                });


            // ------------------------------------------------
            // Count UNIQUE DAYS for each emotion
            //
            // Example:
            //
            // Monday: Anxious
            // Monday: Anxious
            // Monday: Anxious
            //
            // = 1 anxious day, NOT 3.
            // ------------------------------------------------

            const emotionDates = {

                Happy: new Set(),
                Sad: new Set(),
                Anxious: new Set(),
                Neutral: new Set(),
                Calm: new Set()

            };


            weeklyLogs.forEach(log => {

                if (
                    Object.prototype.hasOwnProperty.call(
                        emotionDates,
                        log.emotion
                    )
                ) {

                    const dateString =
                        String(log.log_date)
                            .substring(0, 10);


                    emotionDates[
                        log.emotion
                    ].add(dateString);

                }

            });


            const weeklyCounts = {

                Happy:
                    emotionDates.Happy.size,

                Sad:
                    emotionDates.Sad.size,

                Anxious:
                    emotionDates.Anxious.size,

                Neutral:
                    emotionDates.Neutral.size,

                Calm:
                    emotionDates.Calm.size

            };


            // ------------------------------------------------
            // Find most common emotion
            // ------------------------------------------------

            let mostCommonEmotion =
                'No data';


            let highestCount =
                0;


            Object.keys(
                emotionCounts
            ).forEach(emotion => {

                if (
                    emotionCounts[emotion] >
                    highestCount
                ) {

                    highestCount =
                        emotionCounts[emotion];


                    mostCommonEmotion =
                        emotion;
                }

            });


            // ------------------------------------------------
            // Negative emotion count
            // ------------------------------------------------

            const negativeCount =
                emotionCounts.Sad +
                emotionCounts.Anxious;


            // ------------------------------------------------
            // Rule-based feedback
            // ------------------------------------------------

            const feedback =
                generateRuleBasedFeedback(
                    emotionCounts,
                    weeklyCounts,
                    logs
                );


            // ------------------------------------------------
            // Create analysis report
            // ------------------------------------------------

            const analysisReport = {

                totalLogs:
                    logs.length,


                emotionFrequencies:
                    emotionCounts,


                mostCommonEmotion:
                    mostCommonEmotion,


                weeklyTrends: {

                    happyDays:
                        weeklyCounts.Happy,

                    sadDays:
                        weeklyCounts.Sad,

                    anxiousDays:
                        weeklyCounts.Anxious,

                    neutralDays:
                        weeklyCounts.Neutral,

                    calmDays:
                        weeklyCounts.Calm

                },


                negativeEmotionCount:
                    negativeCount,


                feedback:
                    feedback

            };


            // Display analysis

            displayAnalysis(
                analysisReport
            );


            // Store report

            window.moodAnalysis =
                analysisReport;


            console.log(
                'Mood Analysis Report:',
                analysisReport
            );

        })

        .catch(err => {

            console.error(
                'Analysis error:',
                err
            );

        });
}


// ============================================================
// RULE-BASED FEEDBACK ENGINE
// ============================================================

function generateRuleBasedFeedback(
    emotionCounts,
    weeklyCounts,
    logs
) {

    const feedback = [];


    // Rule 1: Frequent anxiety

    if (
        weeklyCounts.Anxious >= 3
    ) {

        feedback.push(

            '😰 You have recorded feeling anxious on ' +
            weeklyCounts.Anxious +
            ' days this week. Try relaxation exercises, deep breathing, or taking a short break.'

        );

    }


    // Rule 2: Repeated sadness

    if (
        weeklyCounts.Sad >= 3
    ) {

        feedback.push(

            '😢 You have recorded feeling sad on ' +
            weeklyCounts.Sad +
            ' days this week. Consider doing an enjoyable activity or talking to someone you trust.'

        );

    }


    // Rule 3: Positive mood

    if (
        weeklyCounts.Happy >= 3
    ) {

        feedback.push(

            '😊 You have recorded several happy days this week. Keep doing activities that contribute to your positive mood.'

        );

    }


    // Rule 4: Calm emotions

    if (
        weeklyCounts.Calm >= 3
    ) {

        feedback.push(

            '😌 You have experienced several calm days. Continue making time for activities that help you relax.'

        );

    }


    // Rule 5: Negative emotions dominate

    const negative =
        weeklyCounts.Sad +
        weeklyCounts.Anxious;


    const positive =
        weeklyCounts.Happy +
        weeklyCounts.Calm;


    if (
        negative > positive &&
        negative >= 3
    ) {

        feedback.push(

            'Negative emotions have been more frequent than positive emotions this week. Consider giving yourself some rest and support.'

        );

    }


    // Rule 6: Very little data

    if (
        logs.length < 3
    ) {

        feedback.push(

            'Keep logging your emotions regularly so MoodTracker can identify meaningful patterns.'

        );

    }


    // Rule 7: No feedback triggered

    if (
        feedback.length === 0
    ) {

        feedback.push(

            'Your mood pattern appears relatively stable. Continue tracking your emotions to discover longer-term trends.'

        );

    }


    return feedback;
}


// ============================================================
// DISPLAY ANALYSIS REPORT
// ============================================================

function displayAnalysis(report) {

    const container =
        document.getElementById(
            'analysis-report'
        );


    if (!container) {
        return;
    }


    // No data yet

    if (
        report.message
    ) {

        container.innerHTML = `

            <p class="text-muted">
                ${report.message}
            </p>

        `;


        return;
    }


    const weekly =
        report.weeklyTrends;


    const feedbackHTML =
        report.feedback
            .map(item =>

                `<p class="mb-2">${item}</p>`

            )
            .join('');


    container.innerHTML = `

        <div class="analysis-summary">

            <h5>
                Emotion Analysis
            </h5>

            <p>
                <strong>
                    Most common emotion:
                </strong>

                ${report.mostCommonEmotion}

            </p>


            <p>
                <strong>
                    Anxious days this week:
                </strong>

                ${weekly.anxiousDays}

            </p>


            <p>
                <strong>
                    Sad days this week:
                </strong>

                ${weekly.sadDays}

            </p>


            <p>
                <strong>
                    Happy days this week:
                </strong>

                ${weekly.happyDays}

            </p>


            <hr>


            <h6>
                Personalized Feedback
            </h6>


            ${feedbackHTML}

        </div>

    `;
}

// SMART CHAT MODULE
// The website does not need to display a chat window.
// These functions can remain available for future use.

function getChatResponse(message) {

    if (
        !message ||
        message.trim() === ''
    ) {

        return 'Please tell me how you are feeling.';
    }


    const text =
        message
            .toLowerCase()
            .trim();


    // Anxiety

    if (
        text.includes('anxious') ||
        text.includes('anxiety') ||
        text.includes('worried') ||
        text.includes('worry')
    ) {

        return (
            'It sounds like you may be feeling anxious. ' +
            'Try taking a few slow, deep breaths and give yourself a short break.'
        );
    }


    // Sadness

    if (
        text.includes('sad') ||
        text.includes('depressed') ||
        text.includes('unhappy') ||
        text.includes('down')
    ) {

        return (
            'I am sorry that you are feeling down. ' +
            'Consider doing something you enjoy or talking to someone you trust.'
        );
    }


    // Stress

    if (
        text.includes('stress') ||
        text.includes('stressed') ||
        text.includes('pressure')
    ) {

        return (
            'When you feel stressed, try taking a short break, ' +
            'doing some slow breathing, and focusing on one task at a time.'
        );
    }


    // Happiness

    if (
        text.includes('happy') ||
        text.includes('great') ||
        text.includes('good') ||
        text.includes('excited')
    ) {

        return (
            '😊 That is great to hear! Keep doing the things that make you feel positive.'
        );
    }


    // Tiredness

    if (
        text.includes('tired') ||
        text.includes('exhausted') ||
        text.includes('sleep')
    ) {

        return (
            'You may need some time to rest. ' +
            'Try taking a break and getting enough sleep if possible.'
        );
    }


    // Greeting

    if (
        text.includes('hello') ||
        text.includes('hi') ||
        text.includes('hey')
    ) {

        return (
            'Hello! How are you feeling today?'
        );
    }


    // Thanks

    if (
        text.includes('thank') ||
        text.includes('thanks')
    ) {

        return (
            'You are welcome! Remember to take care of yourself.'
        );
    }


    // Default

    return (
        'I am here to listen. You can tell me how you are feeling, ' +
        'for example, anxious, sad, stressed, happy, or tired.'
    );
}


// ============================================================
// CHAT API FUNCTION
// ============================================================

function sendChatMessage(message) {

    return fetch('/api/chat', {

        method: 'POST',

        headers: {

            'Content-Type':
                'application/json'

        },

        body: JSON.stringify({

            message:
                message

        })

    })

        .then(res => {

            if (!res.ok) {

                throw new Error(
                    'Chat API error'
                );
            }


            return res.json();

        })

        .then(data => {

            return data.reply;

        })

        .catch(err => {

            console.error(
                'Chat error:',
                err
            );


            // Local keyword fallback

            return getChatResponse(
                message
            );

        });
}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

    fetch('/api/logout', {

        method: 'POST'

    })

        .then(() =>
            window.location.href =
                '/index.html'
        )

        .catch(() =>
            window.location.href =
                '/index.html'
        );
}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        fetchUserData();

        fetchStats();

        fetchLogs();

        generateAnalysis();

        initializeDailyLimit();

    }
);