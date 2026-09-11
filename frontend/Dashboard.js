// ReRay: Emotion Analysis & Smart Features
// Existing dashboard functions + Advanced Analytics

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
        .catch(() => {});
}

// FETCH BASIC STATS

function fetchStats() {
    fetch('/api/stats?days=30')
        .then(res => res.json())
        .then(data => {

            // Update total logs
            document.getElementById('stat-total').innerText =
                data.total || 0;


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

                } else if (item.emotion === 'Happy') {

                    happy += item.count;

                } else {

                    neutral += item.count;
                }
            });


            document.getElementById('stat-anxious').innerText =
                anxious;

            document.getElementById('stat-happy').innerText =
                happy;

            document.getElementById('stat-neutral').innerText =
                neutral;


            // Existing insights
            updateInsights(data);

        })
        .catch(err => {
            console.error('Stats error:', err);
        });
}

// EXISTING INSIGHTS

function updateInsights(data) {

    const stats = data.statistics || [];


    // Most common emotion
    if (stats.length > 0) {

        const top = stats.reduce((a, b) =>
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


    // Existing trend analysis
    const trendElement =
        document.getElementById(
            'insight-trend'
        );


    if (trendElement) {

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


            if (
                !data.logs ||
                data.logs.length === 0
            ) {

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

    if (
        emotion === 'Anxious' ||
        emotion === 'Sad'
    )
        return 'bg-warning text-dark';

    return 'bg-secondary';
}

// DELETE LOG

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

            fetchCalendar();

            // Refresh advanced analysis
            generateAnalysis();

        })

        .catch(err => {

            alert(
                'Error deleting log: ' +
                err.message
            );

        });
}

// ADVANCED ANALYTICS MODULE
// Rule-based emotion analysis
//
// Features:
// 1. Emotion frequency
// 2. Weekly trends
// 3. Repeated negative emotions
// 4. Rule-based feedback
// 5. Analysis report for frontend


function generateAnalysis() {

    fetch('/api/logs')

        .then(res => res.json())

        .then(data => {

            const logs = data.logs || [];


            if (logs.length === 0) {

                displayAnalysis({
                    message:
                        'Not enough data yet. Keep logging your emotions to receive personalized analysis.'
                });

                return;
            }

            // Count emotion frequencies

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

                    emotionCounts[log.emotion]++;
                }

            });

            // Calculate this week's logs

            const today = new Date();

            const sevenDaysAgo =
                new Date(today);

            sevenDaysAgo.setDate(
                today.getDate() - 6
            );


            const weeklyLogs =
                logs.filter(log => {

                    const logDate =
                        new Date(log.log_date);

                    return (
                        logDate >= sevenDaysAgo &&
                        logDate <= today
                    );

                });

            // Weekly emotion counts

            const weeklyCounts = {

                Happy: 0,
                Sad: 0,
                Anxious: 0,
                Neutral: 0,
                Calm: 0
            };


            weeklyLogs.forEach(log => {

                if (
                    Object.prototype.hasOwnProperty.call(
                        weeklyCounts,
                        log.emotion
                    )
                ) {

                    weeklyCounts[log.emotion]++;
                }

            });

            // Find most common emotion

            let mostCommonEmotion =
                'No data';

            let highestCount = 0;


            Object.keys(emotionCounts)
                .forEach(emotion => {

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

            // Negative emotion count

            const negativeCount =
                emotionCounts.Sad +
                emotionCounts.Anxious;

            // Generate rule-based feedback

            const feedback =
                generateRuleBasedFeedback(
                    emotionCounts,
                    weeklyCounts,
                    logs
                );


            // Create analysis report

            const analysisReport = {

                totalLogs: logs.length,

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


            // Store report for other frontend functions
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

// RULE-BASED FEEDBACK ENGINE

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
            '😰 You have experienced anxiety on ' +
            weeklyCounts.Anxious +
            ' days this week. Try relaxation exercises, deep breathing, or taking a short break.'
        );
    }

    // Rule 2: Repeated sadness

    if (
        weeklyCounts.Sad >= 3
    ) {

        feedback.push(
            '😢 You have recorded feeling sad for ' +
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

// DISPLAY ANALYSIS REPORT

function displayAnalysis(report) {

    const container =
        document.getElementById(
            'analysis-report'
        );


    // If the analysis section does not exist,
    // do not cause errors on the dashboard.

    if (!container) {
        return;
    }


    if (report.message) {

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
                <strong>Most common emotion:</strong>
                ${report.mostCommonEmotion}
            </p>

            <p>
                <strong>Anxious days this week:</strong>
                ${weekly.anxiousDays}
            </p>

            <p>
                <strong>Sad days this week:</strong>
                ${weekly.sadDays}
            </p>

            <p>
                <strong>Happy days this week:</strong>
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
// Simple keyword-based chatbot.
//
// This can be connected to a chat UI later.
// The website does NOT need to display a chat window
// if the team decides not to use one.


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

    // Default response

    return (
        'I am here to listen. You can tell me how you are feeling, ' +
        'for example, anxious, sad, stressed, happy, or tired.'
    );
}

// CHAT API FUNCTION
// If the team creates /api/chat in the backend,
// this function can be used by the frontend chat UI.
// The chatbot logic above can also work independently.

function sendChatMessage(message) {

    return fetch('/api/chat', {

        method: 'POST',

        headers: {
            'Content-Type':
                'application/json'
        },

        body: JSON.stringify({
            message: message
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


            // Fallback to local
            // keyword-based chatbot

            return getChatResponse(
                message
            );
        });
}

// LOGOUT

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

// INITIALIZE

document.addEventListener(
    'DOMContentLoaded',
    function () {

        fetchUserData();

        fetchStats();

        fetchLogs();

        // Advanced analytics
        generateAnalysis();

    }
);
