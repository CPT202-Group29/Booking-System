import { register, login, getCustomerByUserId } from './api.js';

const isRegister = window.location.pathname.includes('register.html');

function showMessage(divId, text, type) {
    const div = document.getElementById(divId);
    if (!div) return;
    div.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => {
        if (div) div.innerHTML = '';
    }, 5000);
}

// Registration
if (isRegister) {
    const form = document.getElementById('registerForm');
    if (form) {
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

                const customer = await getCustomerByUserId(data.userId);
                localStorage.setItem('customerId', customer.id);

                showMessage('message', 'Registration successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            } catch (err) {
                showMessage('message', err.message, 'error');
            }
        });
    }
}
// Login
else {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const savedUser = localStorage.getItem('rememberedUsername');
        if (savedUser) {
            const usernameInput = document.getElementById('username');
            const rememberCheckbox = document.getElementById('rememberMe');
            if (usernameInput) usernameInput.value = savedUser;
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const remember = document.getElementById('rememberMe')?.checked || false;

            try {
                const data = await login(username, password);
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('role', data.role);

                if (remember) {
                    localStorage.setItem('rememberedUsername', username);
                } else {
                    localStorage.removeItem('rememberedUsername');
                }

                const customer = await getCustomerByUserId(data.userId);
                localStorage.setItem('customerId', customer.id);

                showMessage('message', 'Login successful', 'success');
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1000);
            } catch (err) {
                showMessage('message', err.message, 'error');
            }
        });
    }
}
