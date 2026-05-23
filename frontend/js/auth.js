import { sendVerificationCode, register, login, logout, sendResetCode, resetPassword, setCurrentUser } from './api.js';

let countdown = 0;
let countdownInterval = null;

function showMessage(elementId, text, type) {
    const msgDiv = document.getElementById(elementId);
    msgDiv.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => { if (msgDiv) msgDiv.innerHTML = ''; }, 5000);
}

// Registration page
if (window.location.pathname.includes('register.html')) {
    const sendBtn = document.getElementById('sendCodeBtn');
    const emailInput = document.getElementById('email');
    const pwdInput = document.getElementById('password');
    const pwdHint = document.getElementById('pwdHint');

    pwdInput.addEventListener('input', () => {
        const pwd = pwdInput.value;
        const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
        if (regex.test(pwd)) pwdHint.innerText = '✓ Password strength: good';
        else pwdHint.innerText = '✗ Password must be at least 6 characters and contain letters & numbers';
    });

    sendBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) {
            showMessage('message', 'Please enter email first', 'error');
            return;
        }
        if (countdown > 0) {
            showMessage('message', `Please wait ${countdown} seconds`, 'error');
            return;
        }
        try {
            await sendVerificationCode(email);
            showMessage('message', 'Verification code sent (check console)', 'success');
            countdown = 60;
            sendBtn.disabled = true;
            countdownInterval = setInterval(() => {
                countdown--;
                sendBtn.innerText = `${countdown}s`;
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    sendBtn.disabled = false;
                    sendBtn.innerText = 'Send Code';
                }
            }, 1000);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = emailInput.value.trim();
        const password = pwdInput.value;
        const confirm = document.getElementById('confirmPassword').value;
        const code = document.getElementById('verificationCode').value.trim();

        if (!name || !email || !password || !confirm || !code) {
            showMessage('message', 'Please fill all fields', 'error');
            return;
        }
        if (password !== confirm) {
            showMessage('message', 'Passwords do not match', 'error');
            return;
        }
        try {
            await register(name, email, password, code);
            showMessage('message', 'Registration successful! Redirecting to login...', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });
}

// Login page
else if (window.location.pathname.includes('login.html')) {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPwd = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPwd) {
        document.getElementById('email').value = savedEmail;
        document.getElementById('password').value = savedPwd;
        document.getElementById('rememberMe').checked = true;
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('rememberMe').checked;

try {
    const data = await login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setCurrentUser(data.user);
    if (remember) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
    } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
    }

    // 新增：根据角色跳转
    const role = data.user.role;
    let redirectUrl = 'profile.html';  // default customer
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
        redirectUrl = 'admin-dashboard/index.html';
    } else if (role === 'SPECIALIST' || role === 'ROLE_SPECIALIST') {
        // 专家需要检查 approvalStatus
        const approvalStatus = data.user.approvalStatus;
        if (approvalStatus !== 'APPROVED') {
            let msg = 'Your account is pending admin approval. Please wait.';
            if (approvalStatus === 'REJECTED') msg = 'Your application has been rejected. Contact admin.';
            showMessage('message', msg, 'error');
            localStorage.clear();  // 清除无效token
            return;
        }
        redirectUrl = 'specialist-dashboard.html';
    } else {
        redirectUrl = 'profile.html';
    }

    showMessage('message', 'Login successful, redirecting...', 'success');
    setTimeout(() => window.location.href = redirectUrl, 1000);
} catch (err) {
    showMessage('message', err.message, 'error');
}
    });
}

// Forgot password page
else if (window.location.pathname.includes('forgot-password.html')) {
    let resetCountdown = 0;
    const sendBtn = document.getElementById('sendCodeBtn');
    const emailInput = document.getElementById('email');

    sendBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) {
            showMessage('message', 'Please enter email', 'error');
            return;
        }
        if (resetCountdown > 0) {
            showMessage('message', `Please wait ${resetCountdown} seconds`, 'error');
            return;
        }
        try {
            await sendResetCode(email);
            showMessage('message', 'Reset code sent (check console)', 'success');
            resetCountdown = 60;
            sendBtn.disabled = true;
            const interval = setInterval(() => {
                resetCountdown--;
                sendBtn.innerText = `${resetCountdown}s`;
                if (resetCountdown <= 0) {
                    clearInterval(interval);
                    sendBtn.disabled = false;
                    sendBtn.innerText = 'Send Code';
                }
            }, 1000);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });

    document.getElementById('forgotForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const code = document.getElementById('verificationCode').value.trim();
        const newPassword = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (!email || !code || !newPassword || !confirm) {
            showMessage('message', 'Please fill all fields', 'error');
            return;
        }
        if (newPassword !== confirm) {
            showMessage('message', 'New passwords do not match', 'error');
            return;
        }
        try {
            await resetPassword(email, code, newPassword);
            showMessage('message', 'Password reset successful, please login', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });
}
