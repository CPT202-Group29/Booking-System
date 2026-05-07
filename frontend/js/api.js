const API_BASE = 'http://47.111.224.168:8080';

function getToken() {
    return localStorage.getItem('token');
}

async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) return res.json();
    return res.text();
}

export async function register(username, password, role = 'ROLE_CUSTOMER') {
    return authFetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ username, password, role })
    });
}

export async function login(username, password) {
    return authFetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
}

export async function getCustomerByUserId(userId) {
    return authFetch(`${API_BASE}/api/v1/customers/by-user/${userId}`);
}

export async function updateCustomer(customerId, name, phone) {
    return authFetch(`${API_BASE}/api/v1/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, phone })
    });
}

export async function uploadAvatar(customerId, file) {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/v1/customers/${customerId}/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
}

export async function updatePassword(userId, newPassword) {
    return authFetch(`${API_BASE}/api/v1/auth/user/${userId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword })
    });
}

export async function deleteAccount(userId) {
    return authFetch(`${API_BASE}/api/v1/auth/user/${userId}`, {
        method: 'DELETE'
    });
}

export async function getExperts() {
    return authFetch(`${API_BASE}/experts/list`);
}

export async function getExpertById(id) {
    return authFetch(`${API_BASE}/experts/${id}`);
}

export async function getAvailableSlots(specialistId, date) {
    const from = `${date}T00:00:00`;
    const to = `${date}T23:59:59`;
    const data = await authFetch(`${API_BASE}/api/v1/specialists/${specialistId}/availability?from=${from}&to=${to}`);
    const day = data.byDay?.find(d => d.date === date);
    if (!day) return [];
    return day.slots.map(s => ({ id: s.slotId, display: s.time }));
}

export async function createBooking(customerId, specialistId, timeSlotId, topic, notes = '') {
    return authFetch(`${API_BASE}/api/v1/bookings`, {
        method: 'POST',
        body: JSON.stringify({ customerId, specialistId, timeSlotId, topic, notes })
    });
}

export async function getMyBookings(customerId) {
    return authFetch(`${API_BASE}/api/v1/bookings?customerId=${customerId}`);
}

export async function cancelBooking(bookingId, customerId, cancelReason) {
    return authFetch(`${API_BASE}/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ customerId, cancelReason })
    });
}

export async function rescheduleBooking(bookingId, customerId, newTimeSlotId) {
    const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ customerId, newTimeSlotId })
    });
    if (res.status === 409) throw new Error('Time slot already taken');
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
    }
    return res.json();
}
