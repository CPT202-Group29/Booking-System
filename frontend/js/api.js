const API_BASE = 'http://121.196.221.244:8080';

// ========== Auth APIs (Real Backend) ==========
export async function register(name, email, password, verificationCode) {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
}

export async function login(email, password) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
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
    setCurrentUser(data.user);
    return data;
}

export async function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
}

export async function sendVerificationCode(email) {
    console.log(`Verification code requested for ${email} (bypassed)`);
    return { success: true, message: 'Verification code sent' };
}

export async function sendResetCode(email) {
    console.log(`Reset code requested for ${email} (bypassed)`);
    return { success: true };
}

export async function resetPassword(email, verificationCode, newPassword) {
    const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, newPassword })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reset failed');
    }
    return response.json();
}

// ========== Change Password (Real Backend) ==========
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

// ========== Profile APIs (Real Backend) ==========
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
    // 更新本地 currentUser
    const user = getCurrentUser();
    if (user) {
        if (name) user.username = name;
        if (phone) user.phone = phone;
        setCurrentUser(user);
    }
    return { name, phone };
}

export async function uploadAvatar(file) {
    // 暂不实现上传，返回空
    return { avatarUrl: '' };
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

// ========== Bookings APIs (Real Backend B2) ==========
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
        body: JSON.stringify({
            customerId: userId,
            cancelReason: cancelReason
        })
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
        body: JSON.stringify({
            customerId: userId,
            newTimeSlotId: newSlotId
        })
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
