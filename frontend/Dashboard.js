// ==========================================
// MOODTRACKER - MAIN JAVASCRIPT
// ==========================================


// ==========================================
// USER DATA
// ==========================================

function fetchUserData() {

    fetch('/api/user')
        .then(response => {

            if (!response.ok) {
                throw new Error('Failed to fetch user data.');
            }

            return response.json();

        })
        .then(data => {

            const usernameDisplay =
                document.getElementById('username-display');

            if (usernameDisplay) {
                usernameDisplay.textContent =
                    data.username || 'User';
            }

        })
        .catch(error => {

            console.error(
                'Error fetching user data:',
                error
            );

        });

}


// ==========================================
// STATISTICS
// ==========================================

function fetchStats() {

    fetch('/api/stats?days=30')
        .then(response => {

            if (!response.ok) {
                throw new Error('Failed to fetch statistics.');
            }

            return response.json();

        })
        .then(data => {

            const totalElement =
                document.getElementById('stat-total');

            if (totalElement) {
                totalElement.textContent =
                    data.total || 0;
            }

            updateInsights(data);

        })
        .catch(error => {

            console.error(
                'Error fetching statistics:',
                error
            );

        });

}


// ==========================================
// INSIGHTS
// ==========================================

function updateInsights(data) {

    const insightsContainer =
        document.getElementById('insights-container');

    if (!insightsContainer) {
        return;
    }

    const emotionCounts =
        data.emotions || {};

    const happy =
        emotionCounts.Happy || 0;

    const sad =
        emotionCounts.Sad || 0;

    const anxious =
        emotionCounts.Anxious || 0;

    let message =
        'Keep tracking your emotions to discover patterns.';

    if (happy > sad && happy > anxious) {

        message =
            'You have recorded more happy emotions recently. Keep it up!';

    }
    else if (anxious > happy && anxious >= sad) {

        message =
            'You have recorded several anxious emotions recently. Consider taking some time to relax.';

    }
    else if (sad > happy && sad >= anxious) {

        message =
            'You have recorded several sad emotions recently. Consider doing something that helps you feel better.';

    }

    insightsContainer.textContent = message;

}


// ==========================================
// DAILY EMOTION LIMIT
// ==========================================

const DAILY_EMOTION_LIMIT = 5;


function getTodayDate() {

    const today = new Date();

    return today.toISOString().split('T')[0];

}


function getTodayEmotionCount() {

    const today =
        getTodayDate();

    const storedDate =
        localStorage.getItem('emotionLimitDate');

    const storedCount =
        parseInt(
            localStorage.getItem('emotionUseCount') || '0',
            10
        );

    if (storedDate !== today) {

        localStorage.setItem(
            'emotionLimitDate',
            today
        );

        localStorage.setItem(
            'emotionUseCount',
            '0'
        );

        return 0;
    }

    return storedCount;

}


function recordEmotionUse() {

    const currentCount =
        getTodayEmotionCount();

    localStorage.setItem(
        'emotionUseCount',
        String(currentCount + 1)
    );

}


function canLogEmotion() {

    const count =
        getTodayEmotionCount();

    return count < DAILY_EMOTION_LIMIT;

}


function getRemainingEmotionUses() {

    const count =
        getTodayEmotionCount();

    return Math.max(
        0,
        DAILY_EMOTION_LIMIT - count
    );

}


function updateDailyLimitDisplay() {

    const remaining =
        getRemainingEmotionUses();

    const limitDisplay =
        document.getElementById('daily-limit-display');

    if (limitDisplay) {

        limitDisplay.textContent =
            `${remaining} emotion log${remaining === 1 ? '' : 's'} remaining today.`;

    }

}


function startDailyResetChecker() {

    setInterval(() => {

        getTodayEmotionCount();

        updateDailyLimitDisplay();

    }, 60000);

}


// ==========================================
// FETCH LOGS
// ==========================================

function fetchLogs() {

    fetch('/api/logs')
        .then(response => {

            if (!response.ok) {
                throw new Error('Failed to fetch emotion logs.');
            }

            return response.json();

        })
        .then(logs => {

            const logsContainer =
                document.getElementById('recent-logs');

            if (!logsContainer) {
                return;
            }

            logsContainer.innerHTML = '';

            const today =
                getTodayDate();

            const todayLogs =
                logs
                    .filter(log => {

                        if (!log.created_at) {
                            return false;
                        }

                        return log.created_at
                            .startsWith(today);

                    })
                    .slice(0, 10);

            if (todayLogs.length === 0) {

                logsContainer.innerHTML =
                    '<p>No emotion logs recorded today.</p>';

                return;
            }

            todayLogs.forEach(log => {

                const logElement =
                    document.createElement('div');

                logElement.className =
                    'emotion-log';

                logElement.innerHTML = `
                    <div class="emotion-log-content">
                        <strong>
                            ${getEmotionBadge(log.emotion)}
                        </strong>

                        <p>
                            ${log.note || ''}
                        </p>

                        <small>
                            ${log.created_at || ''}
                        </small>
                    </div>

                    <button
                        type="button"
                        onclick="deleteLog(${log.id})">
                        Delete
                    </button>
                `;

                logsContainer.appendChild(
                    logElement
                );

            });

        })
        .catch(error => {

            console.error(
                'Error fetching logs:',
                error
            );

        });

}


// ==========================================
// SUBMIT EMOTION LOG
// ==========================================

function submitEmotionLog(emotion, note) {

    if (!canLogEmotion()) {

        alert(
            'You have reached the daily limit of 5 emotion logs.'
        );

        return;

    }

    fetch('/api/logs', {

        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            emotion: emotion,
            note: note
        })

    })
        .then(response => {

            if (!response.ok) {

                return response.json()
                    .then(data => {

                        throw new Error(
                            data.error ||
                            'Failed to save emotion log.'
                        );

                    });

            }

            return response.json();

        })
        .then(data => {

            recordEmotionUse();

            updateDailyLimitDisplay();

            fetchStats();

            fetchLogs();

            generateAnalysis();

            if (typeof loadCalendar === 'function') {
                loadCalendar();
            }

        })
        .catch(error => {

            console.error(
                'Error submitting emotion log:',
                error
            );

            alert(
                error.message ||
                'Unable to save your emotion log.'
            );

        });

}


// ==========================================
// INITIALIZE DAILY LIMIT
// ==========================================

function initializeDailyLimit() {

    getTodayEmotionCount();

    updateDailyLimitDisplay();

    startDailyResetChecker();

}


// ==========================================
// EMOTION BADGES
// ==========================================

function getEmotionBadge(emotion) {

    const badges = {

        Happy:
            '😊 Happy',

        Sad:
            '😢 Sad',

        Anxious:
            '😟 Anxious'

    };

    return badges[emotion] ||
        emotion ||
        'Unknown';

}


// ==========================================
// DELETE LOG
// ==========================================

function deleteLog(id) {

    if (!confirm('Delete this emotion log?')) {
        return;
    }

    fetch(`/api/logs/${id}`, {

        method: 'DELETE'

    })
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    'Failed to delete emotion log.'
                );
            }

            return response.json();

        })
        .then(data => {

            fetchLogs();

            fetchStats();

            generateAnalysis();

            if (typeof loadCalendar === 'function') {
                loadCalendar();
            }

        })
        .catch(error => {

            console.error(
                'Error deleting log:',
                error
            );

            alert(
                'Unable to delete the emotion log.'
            );

        });

}


// ==========================================
// ADVANCED ANALYTICS
// ==========================================

function generateAnalysis() {

    fetch('/api/logs')
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    'Failed to fetch logs for analysis.'
                );
            }

            return response.json();

        })
        .then(logs => {

            const report =
                generateRuleBasedFeedback(logs);

            displayAnalysis(report);

        })
        .catch(error => {

            console.error(
                'Error generating analysis:',
                error
            );

        });

}


// ==========================================
// RULE-BASED FEEDBACK
// ==========================================

function generateRuleBasedFeedback(logs) {

    if (!Array.isArray(logs) || logs.length === 0) {

        return {
            summary:
                'Start recording your emotions to discover patterns.',
            feedback: []
        };

    }

    const today =
        new Date();

    const sevenDaysAgo =
        new Date();

    sevenDaysAgo.setDate(
        today.getDate() - 7
    );

    const recentLogs =
        logs.filter(log => {

            if (!log.created_at) {
                return false;
            }

            const date =
                new Date(log.created_at);

            return date >= sevenDaysAgo;

        });

    const emotionCounts = {

        Happy: 0,
        Sad: 0,
        Anxious: 0

    };

    recentLogs.forEach(log => {

        if (
            Object.prototype.hasOwnProperty.call(
                emotionCounts,
                log.emotion
            )
        ) {

            emotionCounts[log.emotion]++;

        }

    });

    const feedback = [];

    if (emotionCounts.Anxious >= 3) {

        feedback.push(
            'You have recorded anxious feelings several times this week. Consider taking short breaks, exercising, or talking to someone you trust.'
        );

    }

    if (emotionCounts.Sad >= 3) {

        feedback.push(
            'You have recorded several sad feelings this week. Consider doing activities that you enjoy or spending time with supportive people.'
        );

    }

    if (emotionCounts.Happy >= 3) {

        feedback.push(
            'You have recorded several happy feelings this week. Keep doing activities that contribute to your positive mood.'
        );

    }

    if (feedback.length === 0) {

        feedback.push(
            'Keep tracking your emotions so MoodTracker can identify useful patterns over time.'
        );

    }

    let summary =
        'Your recent mood records show a mixture of emotions.';

    if (
        emotionCounts.Happy >
        emotionCounts.Sad &&
        emotionCounts.Happy >
        emotionCounts.Anxious
    ) {

        summary =
            'Happy has been your most frequently recorded emotion recently.';

    }
    else if (
        emotionCounts.Sad >
        emotionCounts.Happy &&
        emotionCounts.Sad >=
        emotionCounts.Anxious
    ) {

        summary =
            'Sad has been your most frequently recorded emotion recently.';

    }
    else if (
        emotionCounts.Anxious >
        emotionCounts.Happy &&
        emotionCounts.Anxious >=
        emotionCounts.Sad
    ) {

        summary =
            'Anxious has been your most frequently recorded emotion recently.';

    }

    return {

        summary: summary,

        feedback: feedback,

        counts: emotionCounts

    };

}


// ==========================================
// DISPLAY ANALYSIS
// ==========================================

function displayAnalysis(report) {

    const analysisContainer =
        document.getElementById('analysis-container');

    if (!analysisContainer) {
        return;
    }

    analysisContainer.innerHTML = '';

    const summary =
        document.createElement('p');

    summary.textContent =
        report.summary;

    analysisContainer.appendChild(
        summary
    );

    if (
        Array.isArray(report.feedback)
    ) {

        report.feedback.forEach(message => {

            const feedbackElement =
                document.createElement('p');

            feedbackElement.textContent =
                message;

            analysisContainer.appendChild(
                feedbackElement
            );

        });

    }

}


// ==========================================
// AI CHATBOT
// ==========================================
//
// User message
//      ↓
// sendChatMessage()
//      ↓
// POST /api/chat
//      ↓
// Flask backend
//      ↓
// OpenAI API
//      ↓
// AI response
//      ↓
// Display in chatHistory
// ==========================================


function handleChatSend() {

    const input =
        document.getElementById('chatInput');

    const chatHistory =
        document.getElementById('chatHistory');

    if (!input || !chatHistory) {
        return;
    }

    const message =
        input.value.trim();

    if (!message) {
        return;
    }


    // Display user's message immediately

    const userBubble =
        document.createElement('div');

    userBubble.className =
        'chat-bubble user';

    userBubble.textContent =
        message;

    chatHistory.appendChild(
        userBubble
    );


    // Clear input

    input.value = '';


    // Scroll to newest message

    chatHistory.scrollTop =
        chatHistory.scrollHeight;


    // Disable button while waiting

    const sendButton =
        document.getElementById('chatSendButton');

    if (sendButton) {
        sendButton.disabled = true;
    }


    // Show temporary thinking message

    const thinkingBubble =
        document.createElement('div');

    thinkingBubble.className =
        'chat-bubble assistant';

    thinkingBubble.textContent =
        'Thinking...';

    thinkingBubble.id =
        'chatThinkingBubble';

    chatHistory.appendChild(
        thinkingBubble
    );


    chatHistory.scrollTop =
        chatHistory.scrollHeight;


    // Send message to the API

    sendChatMessage(message)
        .then(reply => {

            const thinking =
                document.getElementById(
                    'chatThinkingBubble'
                );

            if (thinking) {

                thinking.textContent =
                    reply;

                thinking.removeAttribute(
                    'id'
                );

            }

            chatHistory.scrollTop =
                chatHistory.scrollHeight;

        })
        .catch(error => {

            console.error(
                'Chat error:',
                error
            );

            const thinking =
                document.getElementById(
                    'chatThinkingBubble'
                );

            if (thinking) {

                thinking.textContent =
                    'Sorry, I could not process your message right now.';

                thinking.removeAttribute(
                    'id'
                );

            }

        })
        .finally(() => {

            if (sendButton) {
                sendButton.disabled = false;
            }

            input.focus();

        });

}


// ==========================================
// SEND CHAT MESSAGE TO FLASK API
// ==========================================

function sendChatMessage(message) {

    if (
        !message ||
        message.trim() === ''
    ) {

        return Promise.resolve(
            'Please tell me how you are feeling.'
        );

    }


    return fetch(
        '/api/chat',
        {

            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body: JSON.stringify({
                message:
                    message.trim()
            })

        }
    )

    .then(response => {

        if (!response.ok) {

            return response.json()
                .then(data => {

                    throw new Error(
                        data.error ||
                        'Chat API error.'
                    );

                })
                .catch(error => {

                    if (
                        error.message ===
                        'Chat API error.'
                    ) {
                        throw error;
                    }

                    throw new Error(
                        'Chat API error.'
                    );

                });

        }

        return response.json();

    })

    .then(data => {

        if (!data || !data.reply) {

            throw new Error(
                'No response received from AI.'
            );

        }

        return data.reply;

    });

}


// ==========================================
// ENTER KEY SUPPORT
// ==========================================

function handleChatKey(event) {

    if (event.key === 'Enter') {

        event.preventDefault();

        handleChatSend();

    }

}

// ==========================================
// LOGOUT
// ==========================================

function logout() {

    fetch('/api/logout', {

        method: 'POST'

    })
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    'Logout failed.'
                );
            }

            window.location.href =
                '/';

        })
        .catch(error => {

            console.error(
                'Logout error:',
                error
            );

        });

}


// ==========================================
// PAGE INITIALIZATION
// ==========================================

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