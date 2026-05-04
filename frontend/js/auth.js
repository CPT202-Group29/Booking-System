import { register, login } from './api.js';

const isRegister = window.location.pathname.includes('register.html');
const isForgot = window.location.pathname.includes('forgot-password.html');

function showMessage(divId, text, type) {
    const div = document.getElementById(divId);
    div.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => div.innerHTML = '', 5000);
}

if (isRegister) {
    const form = document.getElementById('registerForm');
    const pwdInput = document.getElementById('password');
    const hint = document.getElementById('pwdHint');
    pwdInput.addEventListener('input', () => {
        const val = pwdInput.value;
        hint.innerText = val.length >= 6 ? 'Strong enough' : 'Minimum 6 characters';
    });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (password !== confirm) {
            showMessage('message', 'Passwords do not match', 'error');
            return;
        }
        try {
            await register(username, password);
            showMessage('message', 'Registration successful! Redirecting to login...', 'success');
            setTimeout(() => location.href = 'login.html', 1500);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });
} else if (isForgot) {
    // Simplified: just allow password reset (no email, uses username)
    // In real app, you would have verification code, but for demo, we just update password? 
    // Actually no backend endpoint for password reset. We'll skip.
    document.getElementById('forgotForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage('message', 'Password reset feature not implemented by backend yet.', 'error');
    });
} else {
    // Login page
    const savedUser = localStorage.getItem('rememberedUsername');
    if (savedUser) {
        document.getElementById('username').value = savedUser;
        document.getElementById('rememberMe').checked = true;
    }
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('rememberMe').checked;
        try {
            const { customerId, username: uname, role } = await login(username, password);
            localStorage.setItem('customerId', customerId);
            localStorage.setItem('username', uname);
            localStorage.setItem('role', role);
            if (remember) localStorage.setItem('rememberedUsername', username);
            else localStorage.removeItem('rememberedUsername');
            showMessage('message', 'Login successful', 'success');
            setTimeout(() => location.href = 'index.html', 1000);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });
}
