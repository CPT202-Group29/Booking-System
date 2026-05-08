import { getMyBookings } from './api.js'; // 实际上应该用 specialistId 查，但我们需要从 user 对象中取 role 和 id

const userStr = localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;
if (!user || user.role !== 'SPECIALIST') {
    alert('Access denied. Only specialists can view this page.');
    window.location.href = 'login.html';
}
const specialistId = user.userId || user.id;

let allBookings = [];
const pageSize = 5;

async function loadSchedule() {
    try {
        // 调用后端 GET /api/v1/bookings?specialistId=xxx
        const response = await fetch(`http://121.196.221.244:8080/api/v1/bookings?specialistId=${specialistId}`);
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
    container.innerHTML = bookings.map(b => `
        <div class="booking-card">
            <p><strong>Booking ID:</strong> ${b.id}</p>
            <p><strong>Customer ID:</strong> ${b.customerId || 'N/A'}</p>
            <p><strong>Topic:</strong> ${b.topic || 'N/A'}</p>
            <p><strong>Status:</strong> ${b.status}</p>
            <p><strong>Date:</strong> ${b.date || b.slotDate || 'N/A'}</p>
            <p><strong>Fee:</strong> $${b.chargeAmount ?? '0.00'}</p>
        </div>
    `).join('');
}

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
