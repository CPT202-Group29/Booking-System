import { getMyBookings, cancelBooking } from './api.js';

const userStr = localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;
const customerId = user ? (user.userId || user.id) : null;

if (!customerId) {
    document.getElementById('bookingsList').innerHTML = '<p>Please <a href="login.html">login</a> first.</p>';
}

let allBookings = [];
let currentTab = 'upcoming';   // 'upcoming' | 'history'
const pageSize = 5;            // 每页显示5条
let currentPage = 0;

// Tab 切换
document.getElementById('tabUpcoming').addEventListener('click', () => switchTab('upcoming'));
document.getElementById('tabHistory').addEventListener('click', () => switchTab('history'));

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tabUpcoming').classList.toggle('active', tab === 'upcoming');
    document.getElementById('tabHistory').classList.toggle('active', tab === 'history');
    currentPage = 0;
    filterAndRender();
}

async function loadBookings() {
    try {
        if (!customerId) return;
        allBookings = await getMyBookings();    // 从后端获取所有预约
        filterAndRender();
    } catch (err) {
        document.getElementById('bookingsList').innerHTML = `<p class="error">Error loading bookings: ${err.message}</p>`;
    }
}

function filterAndRender() {
    // 根据当前 Tab 筛选
    const now = new Date();
    let filtered = allBookings.filter(b => {
        // 这里假设后端返回的 booking 对象包含 date 字段（如 "2026-05-10"），或 slot date
        const bookingDate = parseBookingDate(b);
        if (!bookingDate) return false;
        if (currentTab === 'upcoming') {
            return bookingDate >= now.setHours(0,0,0,0) && (b.status === 'PENDING' || b.status === 'CONFIRMED');
        } else {
            return bookingDate < now.setHours(0,0,0,0) || (b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'EXPIRED');
        }
    });

    // 排序：Upcoming 按日期升序，History 按日期降序
    filtered.sort((a, b) => {
        const da = parseBookingDate(a) || 0;
        const db = parseBookingDate(b) || 0;
        return currentTab === 'upcoming' ? da - db : db - da;
    });

    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    const start = currentPage * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    renderBookings(pageItems);
    renderPagination(currentPage, totalPages, (page) => {
        currentPage = page;
        filterAndRender();
    });
}

// 从 booking 对象提取日期（优先用 date 字段，否则尝试 slotDate）
function parseBookingDate(booking) {
    if (booking.date) return new Date(booking.date).getTime();
    if (booking.slotDate) return new Date(booking.slotDate).getTime();
    if (booking.createdAt) return new Date(booking.createdAt).getTime();
    return null;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderCancellationNotice(bookings) {
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
    if (!cancelledBookings.length) return '';

    return `
        <div style="border:1px solid #fca5a5;background:#fef2f2;color:#991b1b;padding:14px 16px;border-radius:8px;margin-bottom:14px;">
            <strong>Cancellation Reminder:</strong> One or more of your bookings have been cancelled by the specialist or administrator.
            Please check the cancellation reason and book another available slot if needed.
        </div>
    `;
}

function renderBookings(bookings) {
    const container = document.getElementById('bookingsList');
    if (!bookings.length) {
        container.innerHTML = '<p>No bookings found.</p>';
        return;
    }
    container.innerHTML = renderCancellationNotice(bookings) + bookings.map(b => {
        let timeDisplay = b.date || b.slotDate || '';
        if (b.time) timeDisplay += ' ' + b.time;
        else if (!timeDisplay && b.timeSlotId) timeDisplay = `Slot #${b.timeSlotId}`;
        return `
        <div class="booking-card" data-booking='${JSON.stringify(b).replace(/'/g, "&#39;")}' 
             onclick="showDetail(this)">
            <p><strong>Specialist:</strong> ${b.specialistName || ('ID: ' + b.specialistId) || 'N/A'}</p>
            <p><strong>Topic:</strong> ${escapeHtml(b.topic || 'N/A')}</p>
            <p><strong>Status:</strong> <span class="status-${b.status}">${b.status}</span></p>
            <p><strong>Date:</strong> ${timeDisplay}</p>
            <p><strong>Fee:</strong> ¥${b.chargeAmount ?? '0.00'}</p>
            ${b.status === 'CANCELLED' ? `<p style="color:#dc2626;font-weight:600;"><strong>Important Notice:</strong> This booking has been cancelled by the specialist or administrator. Please check the reason below and book another slot if needed.</p>` : ''}
            ${b.cancelReason ? `<p><strong>Cancel Reason:</strong> ${escapeHtml(b.cancelReason)}</p>` : ''}
            ${b.status === 'CONFIRMED' ? `
                <button class="btn-cancel" data-id="${b.id}" onclick="event.stopPropagation(); handleCancel(${b.id})">Cancel</button>
            ` : ''}
        </div>
        `;
    }).join('');
}

// 简单分页导航
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
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page) && page >= 0 && page < total) callback(page);
        });
    });
}

// 点击卡片或详情按钮，显示详情模态框
window.showDetail = function(card) {
    const booking = JSON.parse(card.dataset.booking);
    const content = document.getElementById('detailContent');
    content.innerHTML = `
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Specialist:</strong> ${booking.specialistName || ('ID: ' + booking.specialistId) || 'N/A'}</p>
        <p><strong>Topic:</strong> ${escapeHtml(booking.topic || 'N/A')}</p>
        <p><strong>Notes:</strong> ${escapeHtml(booking.notes || 'N/A')}</p>
        <p><strong>Status:</strong> ${booking.status}</p>
        <p><strong>Date:</strong> ${booking.date || 'N/A'}</p>
        <p><strong>Time:</strong> ${booking.time || 'N/A'}</p>
        <p><strong>Fee:</strong> ¥${booking.chargeAmount ?? '0.00'}</p>
        ${booking.status === 'CANCELLED' ? '<p style="color:#dc2626;font-weight:600;"><strong>Important Notice:</strong> This booking has been cancelled. Please check the cancellation reason.</p>' : ''}
        <p><strong>Cancel Reason:</strong> ${escapeHtml(booking.cancelReason || 'N/A')}</p>
        <p><strong>Created At:</strong> ${booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}</p>
    `;
    document.getElementById('detailModal').style.display = 'flex';
};

// 关闭模态框（点击背景关闭）
document.getElementById('detailModal')?.addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
});

// 取消和改期逻辑（保留原有逻辑，但使用真实函数）
window.handleCancel = async function(bookingId) {
    const reason = prompt('Please enter the cancellation reason:');
    if (!reason) return;
    try {
        const result = await cancelBooking(bookingId, reason);
        alert(`Booking cancelled successfully.${result.refundAmount ? ` Refund: ¥${result.refundAmount}` : ''}`);
        await loadBookings();
    } catch (err) {
        alert('Cancel failed: ' + err.message);
    }
};



document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'login.html';
});

loadBookings();
