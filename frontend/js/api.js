const API_BASE = 'http://121.196.221.244:8080';

// ========== 通用请求封装（带 token 可选）==========
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        const text = await res.text();
        try {
            const err = JSON.parse(text);
            throw new Error(err.error || `HTTP ${res.status}`);
        } catch {
            throw new Error(text || `HTTP ${res.status}`);
        }
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return res.json();
    }
    return res.text();
}

// ========== 认证 API（新增/修改）==========

// 发送邮箱验证码
export async function sendVerificationCode(email) {
    const response = await fetch(`${API_BASE}/api/v1/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send code');
    }
    return response.json();
}

// 客户注册（需要验证码）
export async function register(name, email, password, verificationCode) {
    const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, verificationCode })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
}

// 专家注册（需要验证码）
export async function registerSpecialist(name, email, expertise, password, verificationCode) {
    const response = await fetch(`${API_BASE}/api/auth/register/specialist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, expertise, password, verificationCode })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Specialist registration failed');
    }
    return response.json();
}

// 登录
export async function login(email, password) {
    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
}

// 登出
export async function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
}

// 发送重置密码验证码
export async function sendResetCode(email) {
    const response = await fetch(`${API_BASE}/api/v1/auth/send-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reset code');
    }
    return response.json();
}

// 重置密码
export async function resetPassword(email, verificationCode, newPassword) {
    const response = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode, newPassword })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reset failed');
    }
    return response.json();
}

// ========== 原有个人资料 API ==========
let currentUser = null;
export function setCurrentUser(user) {
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
}
export function getCurrentUser() {
    if (currentUser) return currentUser;
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
}

export async function fetchProfile() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch profile');
    }
    const data = await response.json();
    setCurrentUser(data);
    return data;
}

export async function updateProfile(name, phone) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE}/api/users/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
    }
    const user = getCurrentUser();
    if (user) {
        if (name) user.username = name;
        if (phone) user.phone = phone;
        setCurrentUser(user);
    }
    return { name, phone };
}

export async function uploadAvatar(file) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/users/me/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload avatar failed');
    }
    const data = await response.json();
    const user = getCurrentUser();
    if (user) {
        user.avatar = data.avatar;
        setCurrentUser(user);
    }
    return data;
}

export async function changePassword(oldPassword, newPassword) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const email = user.email;
    const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, oldPassword, newPassword })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Change password failed');
    }
    return response.json();
}

export async function deleteAccount(password) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE}/api/users/me`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete account failed');
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
}

// ========== 原有预约 API ==========
export async function getMyBookings() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const userId = user.userId || user.id;
    if (!userId) throw new Error('User ID not found');
    const response = await fetch(`${API_BASE}/api/v1/bookings?customerId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch bookings');
    }
    return response.json();
}

export async function cancelBooking(bookingId, cancelReason) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const userId = user.userId || user.id;
    const response = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customerId: userId, cancelReason })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Cancel failed');
    }
    return response.json();
}

export async function rescheduleBooking(bookingId, newSlotId) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const userId = user.userId || user.id;
    const response = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customerId: userId, newTimeSlotId: newSlotId })
    });
    if (response.status === 409) {
        throw new Error('Conflict: This time slot has just been taken by another user');
    }
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Reschedule failed');
    }
    return response.json();
}

export async function createBooking(specialistId, timeSlotId, topic, notes = '') {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const customerId = user.userId || user.id;
    const response = await fetch(`${API_BASE}/api/v1/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customerId, specialistId, timeSlotId, topic, notes })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
    }
    return response.json();
}

// ========== 原有专家 API ==========
export async function getExperts() {
    const response = await fetch(`${API_BASE}/api/v1/specialists`);
    if (!response.ok) throw new Error('Failed to fetch experts');
    return response.json();
}

export async function getSpecialistById(id) {
    const response = await fetch(`${API_BASE}/api/v1/specialists/${id}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch specialist');
    }
    return response.json();
}

export async function getAvailableSlots(specialistId, date) {
    const from = `${date}T00:00:00`;
    const to = `${date}T23:59:59`;
    const response = await fetch(
        `${API_BASE}/api/v1/slots?specialistId=${specialistId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch slots');
    }
    return response.json();
}

export async function getBookingFee(specialistId) {
    const response = await fetch(`${API_BASE}/api/v1/specialists/${specialistId}/fee`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch fee');
    }
    const data = await response.json();
    return data.bookingFee;
}
