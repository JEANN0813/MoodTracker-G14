// ==========================================
// JEANN
// ==========================================


// AUTHENTICATION & TAB SWITCHING 
function switchAuthTab(tab) {
    const vLogin = document.getElementById('authViewLogin');
    const vReg = document.getElementById('authViewRegister');
    const vReset = document.getElementById('authViewReset');
    const vResetStandalone = document.getElementById('authViewResetStandalone');
    const tabHeader = document.getElementById('authTabsHeader');

    
    if (vLogin) vLogin.classList.add('hidden');
    if (vReg) vReg.classList.add('hidden');
    if (vReset) vReset.classList.add('hidden');
    if (vResetStandalone) vResetStandalone.classList.add('hidden');

    if (tabHeader) {
        tabHeader.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
        tabHeader.classList.remove('hidden');   
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

        
        const step1 = document.getElementById('resetStep1');
        const step2 = document.getElementById('resetStep2');
        if (step1) step1.classList.remove('hidden');
        if (step2) step2.classList.add('hidden');
    } else if (tab === 'reset-standalone') {
        
        if (vResetStandalone) vResetStandalone.classList.remove('hidden');
        if (tabHeader) tabHeader.classList.add('hidden');

        const step1 = document.getElementById('standaloneResetStep1');
        const step2 = document.getElementById('standaloneResetStep2');
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

    const pwErr = validatePassword(password);
    if (pwErr) {
    showToastCard('❌ ' + pwErr);
    return;
    }

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

    const pwErr = validatePassword(newPassword);
    if (pwErr) {
      showToastCard('❌ ' + pwErr);
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

function validatePassword(password) {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character.";
    return null;
}

// STANDALONE RESET PASSWORD (from Profile) 

async function handleStandaloneResetSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('standaloneResetEmail').value.trim();

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
            document.getElementById('standaloneResetStep1').classList.add('hidden');
            document.getElementById('standaloneResetStep2').classList.remove('hidden');
        } else {
            showToastCard('❌ ' + (data.error || 'Failed to send code'));
        }
    } catch (err) {
        showToastCard('❌ Server error. Please try again later.');
    }
}

async function handleStandaloneResetConfirm(event) {
    event.preventDefault();
    const email = document.getElementById('standaloneResetEmail').value.trim();
    const code = document.getElementById('standaloneResetCode').value.trim();
    const newPassword = document.getElementById('standaloneResetNewPassword').value.trim();

    if (!email || !code || !newPassword) {
        showToastCard('Please fill in all fields.');
        return;
    }

    const pwErr = validatePassword(newPassword);
    if (pwErr) {
        showToastCard('❌ ' + pwErr);
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
            showToastCard('✅ Password updated!');
            closeAuthModal();

            
            document.getElementById('standaloneResetStep1').classList.remove('hidden');
            document.getElementById('standaloneResetStep2').classList.add('hidden');
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

function logout() {
    // Show confirmation modal instead of logging out immediately
    const modal = document.getElementById('logoutConfirmModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }
}

function closeLogoutConfirm() {
    // Close the confirmation modal 
    const modal = document.getElementById('logoutConfirmModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function confirmLogout() {
    // Close modal first
    closeLogoutConfirm();

    // 1. Call logout API
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
        console.error('Logout error', e);
    }

    // 2. Clear local state
    localStorage.removeItem('currentUser');
    localStorage.removeItem('activeUser');
    localStorage.removeItem('userEmail');
    sessionStorage.clear();

    // 3. Hide app layout & auth screen
    const appLay = document.getElementById('appLayout');
    const authScr = document.getElementById('authScreen');
    const landingScr = document.getElementById('landingScreen');

    if (appLay) appLay.classList.add('hidden');
    if (authScr) authScr.classList.add('hidden');

    // 4. Show Landing page
    if (landingScr) {
        landingScr.classList.remove('hidden');
    }

    // 5. Show toast message
    showToastCard('👋 Logged out successfully');
}

// Profile Action Handlers
function resetPasswordFromProfile() {
    const authScr = document.getElementById('authScreen');
    if (authScr) authScr.classList.remove('hidden');

    switchAuthTab('reset-standalone');   
}


async function deleteAccount() {
  const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }
}

function closeDeleteConfirm() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function confirmDeleteAccount() {
    closeDeleteConfirm();

    try {
        const response = await fetch('/api/user', {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showToastCard('✅ Account deleted successfully');
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to landing page
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1500);
        } else {
            const data = await response.json().catch(() => ({}));
            showToastCard('❌ ' + (data.error || 'Failed to delete account'));
        }
    } catch (err) {
        showToastCard('❌ Network error');
    }
}

function openAuthModal(tab) {
    const authScr = document.getElementById('authScreen');
    if (authScr) authScr.classList.remove('hidden');

    ['regPasswordHints', 'resetPasswordHints'].forEach(id => {
        const box = document.getElementById(id);
        if (box) {
            box.querySelectorAll('.hint').forEach(h => h.classList.remove('valid', 'invalid'));
        }
    });

    switchAuthTab(tab);
}

function closeAuthModal() {
    const authScr = document.getElementById('authScreen');
    if (authScr) authScr.classList.add('hidden');
}
