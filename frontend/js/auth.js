import { register, login, getCustomerByUserId } from './api.js';

const isRegister = window.location.pathname.includes('register.html');

function showMessage(divId, text, type) {
    const div = document.getElementById(divId);
    div.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => div.innerHTML = '', 5000);
}

if (isRegister) {
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (password !== confirm) {
            showMessage('message', 'Passwords do not match', 'error');
            return;
        }
        if (password.length < 6) {
            showMessage('message', 'Password must be at least 6 characters', 'error');
            return;
        }
        try {
            const data = await register(username, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('role', data.role);
            // Fetch customerId using userId
            const customer = await getCustomerByUserId(data.userId);
            localStorage.setItem('customerId', customer.id);
            showMessage('message', 'Registration successful! Redirecting...', 'success');
            setTimeout(() => location.href = 'profile.html', 1500);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });
} else {
    // Login page
    const savedUser = localStorage.getItem('rememberedUsername');
    if (savedUser) {
        document.getElementById('username').value = savedUser;
        document.getElementById('rememberMe').checked = true;
    }
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('rememberMe').checked;
        try {
            const data = await login(username, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('role', data.role);
            if (remember) localStorage.setItem('rememberedUsername', username);
            else localStorage.removeItem('rememberedUsername');
            const customer = await getCustomerByUserId(data.userId);
            localStorage.setItem('customerId', customer.id);
            showMessage('message', 'Login successful', 'success');
            setTimeout(() => location.href = 'profile.html', 1000);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });
}
