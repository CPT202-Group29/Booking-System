import { sendVerificationCode, register, registerSpecialist, login } from './api.js';

// ========== 通用显示消息 ==========
function showMessage(elementId, text, type) {
    const div = document.getElementById(elementId);
    if (!div) return;
    div.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => div.innerHTML = '', 5000);
}

// ========== 注册页面逻辑 ==========
if (window.location.pathname.includes('register.html')) {
    // 标签页切换
    const tabs = document.querySelectorAll('.tab-btn');
    const customerForm = document.getElementById('customerForm');
    const specialistForm = document.getElementById('specialistForm');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.tab === 'customer') {
                customerForm.style.display = 'block';
                specialistForm.style.display = 'none';
            } else {
                customerForm.style.display = 'none';
                specialistForm.style.display = 'block';
            }
        });
    });

    // 客户验证码发送
    let custCountdown = 0;
    const sendCustBtn = document.getElementById('sendCustCodeBtn');
    const custEmail = document.getElementById('custEmail');
    sendCustBtn?.addEventListener('click', async () => {
        const email = custEmail.value.trim();
        if (!email) { showMessage('message', 'Please enter email first', 'error'); return; }
        if (custCountdown > 0) { showMessage('message', `Please wait ${custCountdown}s`, 'error'); return; }
        try {
            await sendVerificationCode(email);
            showMessage('message', 'Code sent (check console)', 'success');
            custCountdown = 60;
            sendCustBtn.disabled = true;
            const interval = setInterval(() => {
                custCountdown--;
                sendCustBtn.innerText = `${custCountdown}s`;
                if (custCountdown <= 0) {
                    clearInterval(interval);
                    sendCustBtn.disabled = false;
                    sendCustBtn.innerText = 'Send Code';
                }
            }, 1000);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });

    // 客户注册提交
    document.getElementById('customerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('custName').value.trim();
        const email = custEmail.value.trim();
        const password = document.getElementById('custPassword').value;
        const confirm = document.getElementById('custConfirmPassword').value;
        const code = document.getElementById('custVerificationCode').value.trim();
        if (!name || !email || !password || !confirm || !code) {
            showMessage('message', 'Please fill all fields', 'error');
            return;
        }
        if (password !== confirm) {
            showMessage('message', 'Passwords do not match', 'error');
            return;
        }
        const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
        if (!pwdRegex.test(password)) {
            showMessage('message', 'Password must be ≥6 chars with letters and numbers', 'error');
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

    // 专家验证码发送
    let specCountdown = 0;
    const sendSpecBtn = document.getElementById('sendSpecCodeBtn');
    const specEmail = document.getElementById('specEmail');
    sendSpecBtn?.addEventListener('click', async () => {
        const email = specEmail.value.trim();
        if (!email) { showMessage('message', 'Please enter email first', 'error'); return; }
        if (specCountdown > 0) { showMessage('message', `Please wait ${specCountdown}s`, 'error'); return; }
        try {
            await sendVerificationCode(email);
            showMessage('message', 'Code sent (check console)', 'success');
            specCountdown = 60;
            sendSpecBtn.disabled = true;
            const interval = setInterval(() => {
                specCountdown--;
                sendSpecBtn.innerText = `${specCountdown}s`;
                if (specCountdown <= 0) {
                    clearInterval(interval);
                    sendSpecBtn.disabled = false;
                    sendSpecBtn.innerText = 'Send Code';
                }
            }, 1000);
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });

    // 专家注册提交
    document.getElementById('specialistForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('specName').value.trim();
        const email = specEmail.value.trim();
        const expertise = document.getElementById('specExpertise').value.trim();
        const password = document.getElementById('specPassword').value;
        const confirm = document.getElementById('specConfirmPassword').value;
        const code = document.getElementById('specVerificationCode').value.trim();
        if (!name || !email || !expertise || !password || !confirm || !code) {
            showMessage('message', 'Please fill all fields', 'error');
            return;
        }
        if (password !== confirm) {
            showMessage('message', 'Passwords do not match', 'error');
            return;
        }
        const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
        if (!pwdRegex.test(password)) {
            showMessage('message', 'Password must be ≥6 chars with letters and numbers', 'error');
            return;
        }
        try {
            await registerSpecialist(name, email, expertise, password, code);
            showMessage('message', 'Application submitted! Please wait for admin approval.', 'success');
            // 清空表单
            document.getElementById('specialistForm').reset();
            document.getElementById('specVerificationCode').value = '';
        } catch (err) {
            showMessage('message', err.message, 'error');
        }
    });
}

// ========== 登录页面逻辑 ==========
else if (window.location.pathname.includes('login.html')) {
    // 记住密码功能
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
            // 存储用户信息（api.js 中已存）
            if (remember) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedPassword', password);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
            }

            // 根据角色跳转
            const role = data.user.role;
            let redirectUrl = 'profile.html'; // 默认客户
            if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
                redirectUrl = 'admin-dashboard/index.html';
            } else if (role === 'SPECIALIST' || role === 'ROLE_SPECIALIST') {
                // 检查专家审核状态
                const approvalStatus = data.user.approvalStatus;
                if (approvalStatus !== 'APPROVED') {
                    let msg = 'Your account is pending approval. Please wait.';
                    if (approvalStatus === 'REJECTED') msg = 'Your application has been rejected.';
                    showMessage('message', msg, 'error');
                    localStorage.clear(); // 清除无效凭证
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
