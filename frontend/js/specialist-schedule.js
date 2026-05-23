
const userStr = localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;
if (!user || user.role !== 'SPECIALIST') {
    alert('Access denied. Only specialists can view this page.');
    window.location.href = 'login.html';
}
const specialistId = user.userId || user.id;

let allBookings = [];
const pageSize = 5;
const API_BASE = 'http://121.196.221.244:8080';

function canSpecialistCancel(status) {
    return status === 'PENDING' || status === 'CONFIRMED';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadSchedule() {
    try {
        // 调用后端 GET /api/v1/bookings?specialistId=xxx
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/v1/bookings?specialistId=${specialistId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch schedule');
        allBookings = await response.json();
        applyFilterAndRender();
    } catch (err) {
        document.getElementById('scheduleList').innerHTML = `<p class="error">${err.message}</p>`;
    }
}

function applyFilterAndRender(page = 0) {
    const status = document.getElementById('statusFilter').value;
    const from = document.getElementById('dateFrom').value;
    const to = document.getElementById('dateTo').value;

    let filtered = allBookings.filter(b => {
        if (status && b.status !== status) return false;
        if (from && b.date && b.date < from) return false;
        if (to && b.date && b.date > to) return false;
        return true;
    });

    // 按日期升序
    filtered.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    const start = page * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    renderSchedule(pageItems);
    renderPagination(page, totalPages, applyFilterAndRender);
}

function renderSchedule(bookings) {
    const container = document.getElementById('scheduleList');
    if (!bookings.length) {
        container.innerHTML = '<p>No bookings found.</p>';
        return;
    }
    container.innerHTML = bookings.map(b => {
        const status = b.status || 'N/A';
        const cancelReminder = status === 'CANCELLED'
            ? `<p style="color:#dc2626; font-weight:600;"><strong>User Reminder:</strong> The customer will see this booking as cancelled in My Bookings. ${b.cancelReason ? `Reason: ${escapeHtml(b.cancelReason)}` : ''}</p>`
            : '';
        const actionBtn = canSpecialistCancel(status)
            ? `<button class="btn-cancel-booking" onclick="handleSpecialistCancel(${b.id})" style="background:#dc2626;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;">Cancel Booking</button>`
            : '';
        return `
        <div class="booking-card">
            <p><strong>Booking ID:</strong> ${b.id}</p>
            <p><strong>Customer ID:</strong> ${b.customerId || 'N/A'}</p>
            <p><strong>Topic:</strong> ${escapeHtml(b.topic || 'N/A')}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Date:</strong> ${b.date || b.slotDate || 'N/A'}</p>
            <p><strong>Fee:</strong> $${b.chargeAmount ?? '0.00'}</p>
            ${b.cancelReason ? `<p><strong>Cancel Reason:</strong> ${escapeHtml(b.cancelReason)}</p>` : ''}
            ${cancelReminder}
            ${actionBtn}
        </div>
    `;
    }).join('');
}

window.handleSpecialistCancel = async function(bookingId) {
    const reason = prompt('Please enter a clear cancellation reason for the customer:');
    if (!reason || !reason.trim()) return;

    const confirmed = confirm('After cancellation, the customer will see a clear cancellation reminder in My Bookings. Continue?');
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/admin-cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                specialistId: specialistId,
                cancelReason: reason.trim(),
                reason: reason.trim(),
                changedBy: 'SPECIALIST'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Cancel failed. Status: ${response.status}`);
        }

        alert('Booking cancelled successfully. The customer will be clearly reminded in My Bookings.');
        await loadSchedule();
    } catch (err) {
        alert('Cancel failed: ' + err.message);
    }
};

function renderPagination(current, total, callback) {
    const container = document.getElementById('pagination');
    if (total <= 1) { container.innerHTML = ''; return; }
    let html = '';
    html += `<button ${current === 0 ? 'disabled' : ''} data-page="${current - 1}">← Prev</button>`;
    for (let i = 0; i < total; i++) {
        html += `<button class="${i === current ? 'active' : ''}" data-page="${i}">${i + 1}</button>`;
    }
    html += `<button ${current >= total - 1 ? 'disabled' : ''} data-page="${current + 1}">Next →</button>`;
    container.innerHTML = html;
    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const p = parseInt(e.target.dataset.page);
            if (!isNaN(p)) callback(p);
        });
    });
}

document.getElementById('applyFilterBtn').addEventListener('click', () => applyFilterAndRender(0));
loadSchedule();
