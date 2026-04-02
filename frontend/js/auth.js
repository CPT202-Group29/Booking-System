import { sendVerificationCode, register, login, logout, sendResetCode, resetPassword, setCurrentUser } from './api.js';

// 全局变量：倒计时
let countdown = 0;
let countdownInterval = null;

// 通用显示消息
function showMessage(elementId, text, type) {
    const msgDiv = document.getElementById(elementId);
    msgDiv.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => { if (msgDiv) msgDiv.innerHTML = ''; }, 5000);
}

// 注册页面逻辑
if (window.location.pathname.includes('register.html')) {
    const sendBtn = document.getElementById('sendCodeBtn');
    const emailInput = document.getElementById('email');
    const pwdInput = document.getElementById('password');
    const pwdHint = document.getElementById('pwdHint');

    // 实时密码强度提示
    pwdInput.addEventListener('input', () => {
        const pwd = pwdInput.value;
        const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
        if (regex.test(pwd)) pwdHint.innerText = '✓ 密码强度合格';
        else pwdHint.innerText = '✗ 密码需至少6位且包含字母和数字';
    });

    // 发送验证码按钮
    sendBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) {
            showMessage('message', '请先填写邮箱', 'error');
            return;
        }
        if (countdown > 0) {
            showMessage('message', `请等待 ${countdown} 秒后再试`, 'error');
            return;
        }
        try {
            await sendVerificationCode(email);
            showMessage('message', '验证码已发送（控制台查看）', 'success');
            // 60秒倒计时
            countdown = 60;
            sendBtn.disabled = true;
            countdownInterval = setInterval(() => {
                countdown--;
                sendBtn.innerText = `${countdown}秒后重发`;
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    sendBtn.disabled = false;
                    sendBtn.innerText = '发送验证码';
                }
            }, 1000);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });

    // 注册提交
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = emailInput.value.trim();
        const password = pwdInput.value;
        const confirm = document.getElementById('confirmPassword').value;
        const code = document.getElementById('verificationCode').value.trim();

        if (!name || !email || !password || !confirm || !code) {
            showMessage('message', '请填写所有字段', 'error');
            return;
        }
        if (password !== confirm) {
            showMessage('message', '两次密码不一致', 'error');
            return;
        }
        try {
            await register(name, email, password, code);
            showMessage('message', '注册成功！正在跳转到登录页...', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });
}

// 登录页面逻辑
else if (window.location.pathname.includes('login.html')) {
    // 记住密码功能：加载本地存储的邮箱密码
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
            const { token, user } = await login(email, password);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setCurrentUser(user);
            if (remember) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedPassword', password);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
            }
            showMessage('message', '登录成功，跳转中...', 'success');
            setTimeout(() => window.location.href = 'profile.html', 1000);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });
}

// 忘记密码页面逻辑
else if (window.location.pathname.includes('forgot-password.html')) {
    let resetCountdown = 0;
    const sendBtn = document.getElementById('sendCodeBtn');
    const emailInput = document.getElementById('email');

    sendBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) {
            showMessage('message', '请输入邮箱', 'error');
            return;
        }
        if (resetCountdown > 0) {
            showMessage('message', `请等待 ${resetCountdown} 秒后再试`, 'error');
            return;
        }
        try {
            await sendResetCode(email);
            showMessage('message', '重置验证码已发送（控制台查看）', 'success');
            resetCountdown = 60;
            sendBtn.disabled = true;
            const interval = setInterval(() => {
                resetCountdown--;
                sendBtn.innerText = `${resetCountdown}秒后重发`;
                if (resetCountdown <= 0) {
                    clearInterval(interval);
                    sendBtn.disabled = false;
                    sendBtn.innerText = '发送验证码';
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
            showMessage('message', '请填写所有字段', 'error');
            return;
        }
        if (newPassword !== confirm) {
            showMessage('message', '两次新密码不一致', 'error');
            return;
        }
        try {
            await resetPassword(email, code, newPassword);
            showMessage('message', '密码重置成功，请登录', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });
}
