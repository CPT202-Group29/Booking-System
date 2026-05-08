import { getMyBookings, cancelBooking, rescheduleBooking, getAvailableSlots } from './api.js';

const userStr = localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;
const customerId = user ? (user.userId || user.id) : null;

if (!customerId) {
    document.getElementById('bookingsList').innerHTML = '<p>Please <a href="login.html">login</a> first.</p>';
}

async function loadBookings() {
    try {
        if (!customerId) return;
        const bookings = await getMyBookings();
        renderBookings(bookings);
    } catch (err) {
        document.getElementById('bookingsList').innerHTML = `<p class="error">Error loading bookings: ${err.message}</p>`;
    }
}

function renderBookings(bookings) {
    const container = document.getElementById('bookingsList');
    if (!bookings.length) {
        container.innerHTML = '<p>No bookings found.</p>';
        return;
    }
    container.innerHTML = bookings.map(b => {
        let timeDisplay = b.date || '';
        if (b.time) timeDisplay += ' ' + b.time;
        else if (!timeDisplay && b.timeSlotId) timeDisplay = `Slot #${b.timeSlotId}`;
        return `
        <div class="booking-card" data-id="${b.id}" data-specialist-id="${b.specialistId || ''}">
            <p><strong>Specialist ID:</strong> ${b.specialistId || 'N/A'}</p>
            <p><strong>Topic:</strong> ${b.topic || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status-${b.status}">${b.status}</span></p>
            <p><strong>Date:</strong> ${timeDisplay}</p>
            <p><strong>Fee:</strong> $${b.chargeAmount ?? '0.00'}</p>
            ${b.cancelReason ? `<p><strong>Cancel Reason:</strong> ${b.cancelReason}</p>` : ''}
            ${b.status === 'CONFIRMED' ? `
                <button class="btn-cancel" data-id="${b.id}">Cancel</button>
                <button class="btn-reschedule" data-id="${b.id}">Reschedule</button>
            ` : ''}
        </div>
        `;
    }).join('');

    // 取消按钮事件
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', async () => {
            const bookingId = parseInt(btn.dataset.id);
            const reason = prompt('Please enter the cancellation reason:');
            if (!reason) return;
            try {
                const result = await cancelBooking(bookingId, reason);
                alert(`Booking cancelled successfully.${result.refundAmount ? ` Refund: $${result.refundAmount}` : ''}`);
                loadBookings();
            } catch (err) {
                alert('Cancel failed: ' + err.message);
            }
        });
    });

    // 改期按钮事件
    document.querySelectorAll('.btn-reschedule').forEach(btn => {
        btn.addEventListener('click', async () => {
            const bookingId = parseInt(btn.dataset.id);
            const card = btn.closest('.booking-card');
            const specialistId = card ? card.dataset.specialistId : null;
            if (!specialistId) {
                alert('Cannot identify specialist for this booking.');
                return;
            }
            // 获取未来7天的可用槽位
            const today = new Date().toISOString().split('T')[0];
            try {
                const slots = await getAvailableSlots(specialistId, today);
                const slotListDiv = document.getElementById('rescheduleSlotList');
                if (!slots.length) {
                    slotListDiv.innerHTML = '<p>No available slots in the coming week.</p>';
                } else {
                    let html = '<ul>';
                    slots.forEach(s => {
                        const start = s.startTime ? new Date(s.startTime).toLocaleString() : '';
                        const end = s.endTime ? new Date(s.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
                        html += `<li><label><input type="radio" name="newSlot" value="${s.id}"> ${start} - ${end}</label></li>`;
                    });
                    html += '</ul>';
                    slotListDiv.innerHTML = html;
                }
                document.getElementById('rescheduleModal').style.display = 'flex';
                // 确认按钮事件
                const confirmBtn = document.getElementById('confirmRescheduleBtn');
                const newClickHandler = async () => {
                    const selected = document.querySelector('input[name="newSlot"]:checked');
                    if (!selected) {
                        alert('Please select a slot.');
                        return;
                    }
                    const newSlotId = parseInt(selected.value);
                    try {
                        await rescheduleBooking(bookingId, newSlotId);
                        alert('Rescheduled successfully!');
                        document.getElementById('rescheduleModal').style.display = 'none';
                        loadBookings();
                    } catch (err) {
                        alert('Reschedule failed: ' + err.message);
                    }
                };
                // 移除旧的事件监听，简单处理：替换按钮
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                newConfirmBtn.addEventListener('click', newClickHandler);
            } catch (err) {
                alert('Failed to load available slots: ' + err.message);
            }
        });
    });
}

document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'login.html';
});

loadBookings();
