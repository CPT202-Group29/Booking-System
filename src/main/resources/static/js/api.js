// ==================== API Base ====================
const API = '/api/v1';

// ==================== Auth ====================

export async function sendVerificationCode(email) {
    const resp = await fetch(`${API}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to send code');
    }
    return resp.json();
}

export async function register(name, email, password, verificationCode) {
    const resp = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, verificationCode })
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Registration failed');
    }
    const data = await resp.json();
    return {
        success: true,
        token: data.token,
        user: { id: data.userId, name, email, role: data.role }
    };
}

export async function login(email, password) {
    const resp = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Login failed');
    }
    const data = await resp.json();
    return {
        token: data.token,
        user: { id: data.userId, name: data.username || email, email, role: data.role }
    };
}

export async function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
}

export async function sendResetCode(email) {
    const resp = await fetch(`${API}/auth/send-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to send reset code');
    }
    return resp.json();
}

export async function resetPassword(email, verificationCode, newPassword) {
    const resp = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode, newPassword })
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Reset failed');
    }
    return resp.json();
}

// ==================== Profile ====================

let currentUser = null;
export function setCurrentUser(user) { currentUser = user; }
export function getCurrentUser() { return currentUser; }

export async function fetchProfile() {
    const token = localStorage.getItem('token');
    const resp = await fetch(`${API}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error('Failed to fetch profile');
    const data = await resp.json();
    return { id: data.userId, name: data.name, email: data.email, phone: data.phone || '', avatar: data.avatarUrl || '' };
}

export async function updateProfile(name, phone) {
    const token = localStorage.getItem('token');
    const resp = await fetch(`${API}/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
    });
    if (!resp.ok) throw new Error('Failed to update profile');
    return resp.json();
}

export async function uploadAvatar(file) {
    // Convert file to base64 data URL and save via profile update
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const avatarUrl = e.target.result; // data:image/png;base64,...
            const token = localStorage.getItem('token');
            const resp = await fetch(`${API}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatarUrl })
            });
            if (!resp.ok) throw new Error('Failed to save avatar');
            resolve({ avatarUrl });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function changePassword(oldPassword, newPassword) {
    const token = localStorage.getItem('token');
    const resp = await fetch(`${API}/profile/change-password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
    });
    if (!resp.ok) throw new Error('Failed to change password');
    return resp.json();
}

export async function deleteAccount(password) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const resp = await fetch(`${API}/auth/user/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error('Failed to delete account');
    return resp.json();
}

// ==================== Bookings ====================

export async function getMyBookings() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const userId = user.id;

    const resp = await fetch(`${API}/bookings?customerId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) {
        const error = await resp.text();
        throw new Error(error || 'Failed to fetch bookings');
    }
    return resp.json();
}

export async function cancelBooking(bookingId, cancelReason) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);

    const resp = await fetch(`${API}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customerId: user.id, cancelReason })
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Cancel failed');
    }
    return resp.json();
}

export async function rescheduleBooking(bookingId, newSlotId) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);

    const resp = await fetch(`${API}/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customerId: user.id, newTimeSlotId: newSlotId })
    });
    if (resp.status === 409) {
        throw new Error('Conflict: This time slot has just been taken by another user');
    }
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Reschedule failed');
    }
    return resp.json();
}
