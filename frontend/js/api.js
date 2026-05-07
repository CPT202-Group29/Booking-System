const API_BASE = 'http://47.111.224.168:8080';

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
    return data;
}

export async function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
}

// Verification code — for now just returns success; backend will handle actual sending
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

// ========== Profile APIs (Mock for now — backend not ready) ==========
let currentUser = null;
export function setCurrentUser(user) { currentUser = user; }
export function getCurrentUser() { return currentUser; }

export async function fetchProfile() {
    if (!currentUser) throw new Error('Not logged in');
    // Mock
    return { id: 1, name: currentUser.name || 'User', email: currentUser.email, phone: '', avatar: '' };
}
export async function updateProfile(name, phone) {
    currentUser.name = name;
    currentUser.phone = phone;
    return { name, phone };
}
export async function uploadAvatar(file) {
    return { avatarUrl: '' };
}
export async function changePassword(oldPassword, newPassword) {
    return { success: true };
}
export async function deleteAccount(password) {
    return { success: true };
}

// ========== Bookings APIs (Keep existing — not touched) ==========
export async function getMyBookings() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE}/api/bookings/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
}

export async function cancelBooking(bookingId, cancelReason) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id, cancel_reason: cancelReason })
    });
    if (!response.ok) throw new Error('Cancel failed');
    return response.json();
}

export async function rescheduleBooking(bookingId, newSlotId) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id, new_slot_id: newSlotId })
    });
    if (!response.ok) throw new Error('Reschedule failed');
    return response.json();
}
