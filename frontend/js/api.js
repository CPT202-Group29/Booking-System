// ---------- Mock 数据库 ----------
let mockUsers = [
    { id: 1, name: '张三', email: 'test@example.com', password: '123456', phone: '', avatar: '', role: 'CUSTOMER', failedAttempts: 0, lockedUntil: null }
];
let mockVerificationCodes = {}; // { email: { code, expireTime } }

// 辅助：保存用户到 localStorage（模拟持久化）
function saveUsers() {
    localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
}
function loadUsers() {
    const stored = localStorage.getItem('mockUsers');
    if (stored) mockUsers = JSON.parse(stored);
}
loadUsers();

// ---------- 注册相关 ----------
// 发送验证码（模拟，实际应后端发送）
export async function sendVerificationCode(email) {
    // 模拟60秒冷却（前端倒计时由调用方处理）
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    mockVerificationCodes[email] = { code, expireTime: Date.now() + 5 * 60 * 1000 }; // 5分钟有效
    console.log(`验证码已发送到 ${email}: ${code}`); // 模拟打印，实际可alert
    return { success: true, message: '验证码已发送' };
}

// 注册
export async function register(name, email, password, verificationCode) {
    // 校验验证码
    const record = mockVerificationCodes[email];
    if (!record || record.code !== verificationCode || Date.now() > record.expireTime) {
        throw new Error('验证码错误或已过期');
    }
    // 检查邮箱是否已存在
    if (mockUsers.find(u => u.email === email)) {
        throw new Error('邮箱已被注册');
    }
    // 密码强度：至少6字符，包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
        throw new Error('密码必须至少6位，且同时包含字母和数字');
    }
    const newUser = {
        id: mockUsers.length + 1,
        name,
        email,
        password,
        phone: '',
        avatar: '',
        role: 'CUSTOMER',
        failedAttempts: 0,
        lockedUntil: null
    };
    mockUsers.push(newUser);
    saveUsers();
    delete mockVerificationCodes[email];
    return { success: true, message: '注册成功' };
}

// ---------- 登录相关 ----------
// 登录（含失败计数和锁定）
export async function login(email, password) {
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
        throw new Error('邮箱或密码错误');
    }
    // 检查账户是否被锁定
    if (user.lockedUntil && Date.now() < user.lockedUntil) {
        throw new Error('账户已锁定，请15分钟后重试');
    }
    // 密码验证
    if (user.password !== password) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= 5) {
            user.lockedUntil = Date.now() + 15 * 60 * 1000; // 锁定15分钟
            user.failedAttempts = 0;
            saveUsers();
            throw new Error('连续5次登录失败，账户已锁定15分钟');
        }
        saveUsers();
        throw new Error('邮箱或密码错误');
    }
    // 登录成功，重置失败计数
    user.failedAttempts = 0;
    user.lockedUntil = null;
    saveUsers();
    const token = 'fake-jwt-token-' + Date.now();
    const userInfo = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar };
    return { token, user: userInfo };
}

// 登出
export async function logout() {
    // 前端清除本地存储即可，模拟后端清除session
    return { success: true };
}

// 忘记密码 - 发送重置验证码
export async function sendResetCode(email) {
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
        throw new Error('该邮箱未注册');
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    mockVerificationCodes[email] = { code, expireTime: Date.now() + 5 * 60 * 1000 };
    console.log(`重置验证码已发送到 ${email}: ${code}`);
    return { success: true };
}

// 重置密码
export async function resetPassword(email, verificationCode, newPassword) {
    const record = mockVerificationCodes[email];
    if (!record || record.code !== verificationCode || Date.now() > record.expireTime) {
        throw new Error('验证码错误或已过期');
    }
    const user = mockUsers.find(u => u.email === email);
    if (!user) throw new Error('用户不存在');
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new Error('新密码必须至少6位，且同时包含字母和数字');
    }
    user.password = newPassword;
    saveUsers();
    delete mockVerificationCodes[email];
    return { success: true };
}

// ---------- Profile 相关 ----------
// 获取当前用户资料（需要token，这里简化用全局currentUser）
let currentUser = null;
export function setCurrentUser(user) {
    currentUser = user;
}
export function getCurrentUser() {
    return currentUser;
}
export async function fetchProfile() {
    if (!currentUser) throw new Error('未登录');
    const user = mockUsers.find(u => u.id === currentUser.id);
    if (!user) throw new Error('用户不存在');
    return { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar };
}
export async function updateProfile(name, phone) {
    if (!currentUser) throw new Error('未登录');
    const user = mockUsers.find(u => u.id === currentUser.id);
    if (name) user.name = name;
    if (phone) {
        // 手机号简单验证：数字，10-15位
        if (!/^\d{10,15}$/.test(phone)) throw new Error('手机号格式不正确（10-15位数字）');
        user.phone = phone;
    }
    saveUsers();
    currentUser.name = user.name;
    currentUser.phone = user.phone;
    return { name: user.name, phone: user.phone };
}
export async function uploadAvatar(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarUrl = e.target.result; // base64 模拟存储
            const user = mockUsers.find(u => u.id === currentUser.id);
            user.avatar = avatarUrl;
            saveUsers();
            currentUser.avatar = avatarUrl;
            resolve({ avatarUrl });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
export async function changePassword(oldPassword, newPassword) {
    if (!currentUser) throw new Error('未登录');
    const user = mockUsers.find(u => u.id === currentUser.id);
    if (user.password !== oldPassword) throw new Error('旧密码不正确');
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) throw new Error('新密码必须至少6位，且同时包含字母和数字');
    user.password = newPassword;
    saveUsers();
    return { success: true };
}
export async function deleteAccount(password) {
    if (!currentUser) throw new Error('未登录');
    const user = mockUsers.find(u => u.id === currentUser.id);
    if (user.password !== password) throw new Error('密码错误');
    const index = mockUsers.findIndex(u => u.id === currentUser.id);
    mockUsers.splice(index, 1);
    saveUsers();
    return { success: true };
}
