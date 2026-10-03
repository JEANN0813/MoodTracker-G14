// ==========================================================================
// Aya
// ==========================================================================
// PROFILE VIEW LOGIC 
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
        if (btn.dataset.avatar === emoji) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
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
  const savedAvatar = localStorage.getItem('selectedAvatar') || '🦊';
  selectAvatar(savedAvatar);
}


// HELPER CALCULATIONS


/**
 * Calculates current consecutive daily logging streak.
 */
function calculateStreak(logs) {
  if (!logs || logs.length === 0) return 0;

  // Sort unique dates descending
  const uniqueDates = [...new Set(logs.map(log => log.log_date))].sort().reverse();
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
    const mood = log.emotion || 'Neutral';
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

// ==========================================================================
// JEANN
// ==========================================================================

// EDIT PROFILE MODAL
function editProfile() {
    // 1. 
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

           
            if (bdayEl && user.birthday) {
                const parts = user.birthday.split('/');
                if (parts.length === 3) {
                    bdayEl.value = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                }
            }

            if (genderEl) genderEl.value = user.gender || '';
            if (bioEl) bioEl.value = user.bio || '';

            
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
    const birthdayRaw = document.getElementById('editBirthday')?.value;   // "2000-01-01"
    const gender = document.getElementById('editGender')?.value;
 

    if (!username ) {
        showToastCard('Username is required');
        return;
    }

    
    let birthday = '';
    if (birthdayRaw) {
        const [y, m, d] = birthdayRaw.split('-');
        birthday = `${d}/${m}/${y}`;
    }

    const payload = { username, birthday, gender };

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