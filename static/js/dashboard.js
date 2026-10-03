// ==========================================
// MOODTRACKER - MAIN JAVASCRIPT
// ==========================================

// ==========================================
// AHMED RAYYAN
// ==========================================
//  STATE & GLOBAL VARIABLES 
let activeUser = "User";
let activeUserId = null;
let selectedEmotion = null;
let selectedIcon = "";
let currentDate = new Date();
let activeTargetDate = new Date().toISOString().split('T')[0];



// MOOD CHART STATE 
const MOOD_VALUES = {
    Anxious: 0,
    Sad: 1,
    Neutral: 2,
    Calm: 3,
    Happy: 4
};

const MOOD_LABELS = [
    "Anxious",
    "Sad",
    "Neutral",
    "Calm",
    "Happy"
];

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


function switchView(viewId, element) {
    const views = ['dashboardView', 'historyView', 'alarmView', 'profileView'];
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



//  INITIALIZATION
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













































