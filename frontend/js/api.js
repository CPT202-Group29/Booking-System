const API_BASE = 'http://localhost:8080';  // Change to your backend URL

// ---------- Authentication (B1) ----------
export async function register(username, password, role = 'ROLE_CUSTOMER') {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
    });
    const text = await res.text();
    if (!res.ok || text.includes('already exists')) throw new Error(text);
    return text;
}

export async function login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
    }
    const data = await res.json();
    // data: { id, username, role, message }
    return { customerId: data.id, username: data.username, role: data.role };
}

// ---------- Customer (B1) ----------
export async function getCustomer(customerId) {
    const res = await fetch(`${API_BASE}/api/customers/${customerId}`);
    if (!res.ok) throw new Error('Failed to fetch customer');
    return res.json();
}

export async function updateCustomer(customerId, name, phone) {
    const res = await fetch(`${API_BASE}/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }) // only name and phone are updated
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
}

// ---------- Experts (B1) ----------
export async function getExperts() {
    const res = await fetch(`${API_BASE}/experts/list`);
    if (!res.ok) throw new Error('Failed to load experts');
    return res.json();
}

export async function getExpertById(id) {
    const res = await fetch(`${API_BASE}/experts/${id}`);
    if (!res.ok) throw new Error('Expert not found');
    return res.json();
}

// ---------- Availability (B2) ----------
export async function getAvailableSlots(specialistId, date) {
    const from = `${date}T00:00:00`;
    const to = `${date}T23:59:59`;
    const url = `${API_BASE}/api/v1/specialists/${specialistId}/availability?from=${from}&to=${to}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load slots');
    const data = await res.json();
    // data.byDay[0].slots => [{ slotId, time }]
    const day = data.byDay?.find(d => d.date === date);
    if (!day) return [];
    return day.slots.map(s => ({ id: s.slotId, display: s.time }));
}

// ---------- Bookings (B2) ----------
export async function createBooking(customerId, specialistId, timeSlotId, topic, notes = '') {
    const res = await fetch(`${API_BASE}/api/v1/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, specialistId, timeSlotId, topic, notes })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
    }
    return res.json();
}

export async function getMyBookings(customerId) {
    const res = await fetch(`${API_BASE}/api/v1/bookings?customerId=${customerId}`);
    if (!res.ok) throw new Error('Failed to load bookings');
    return res.json(); // array of booking objects
}

export async function cancelBooking(bookingId, customerId, cancelReason) {
    const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, cancelReason })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
    }
    return res.json();
}

export async function rescheduleBooking(bookingId, customerId, newTimeSlotId) {
    const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, newTimeSlotId })
    });
    if (res.status === 409) throw new Error('Time slot already taken');
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
    }
    return res.json();
}
