const API_BASE = 'http://localhost:8080';          // B1 / B2
const EXPERT_API_BASE = 'http://localhost:8082';   // BE3 specialist service

function getToken() {
    return localStorage.getItem('token');
}

async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    if (res.status === 204) return null;

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return res.json();
    }

    return res.text();
}

// ---------- Authentication (B1) ----------
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

// ---------- Customer (B1) ----------
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
    const formData = new FormData();
    formData.append('file', file);

    const token = getToken();
    const res = await fetch(`${API_BASE}/api/v1/customers/${customerId}/avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!res.ok) throw new Error('Upload failed');
    return res.json();
}

// ---------- Account Security (B1) ----------
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

// ---------- Experts (BE3) ----------
export async function getExperts() {
    return authFetch(`${EXPERT_API_BASE}/experts/list`);
}

export async function getExpertById(id) {
    return authFetch(`${EXPERT_API_BASE}/experts/${id}`);
}

// ---------- Availability (B2) ----------
export async function getAvailableSlots(specialistId, date) {
    const from = `${date}T00:00:00`;
    const to = `${date}T23:59:59`;
    const url = `${API_BASE}/api/v1/specialists/${specialistId}/availability?from=${from}&to=${to}`;
    const data = await authFetch(url);

    const day = data.byDay?.find(d => d.date === date);
    if (!day) return [];

    return day.slots.map(s => ({
        id: s.slotId,
        display: s.time
    }));
}

// ---------- Bookings (B2) ----------
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