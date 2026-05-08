import { getMyBookings, cancelBooking, rescheduleBooking } from './api.js';

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
        // 尝试提取时间显示
        let timeDisplay = b.time || '';
        if (!timeDisplay && b.date) {
            timeDisplay = b.date;
            if (b.time) timeDisplay += ' ' + b.time;
        } else if (!timeDisplay) {
            timeDisplay = `Slot #${b.timeSlotId || 'N/A'}`;
        }

        return `
        <div class="booking-card" data-id="${b.id}">
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
                await cancelBooking(bookingId, reason);
                alert('Booking cancelled successfully');
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
            const newSlotId = prompt('Please enter the new time slot ID:\n(Find available slots on the Specialist Details page)');
            if (!newSlotId || isNaN(parseInt(newSlotId))) {
                alert('Invalid slot ID');
                return;
            }
            try {
                await rescheduleBooking(bookingId, parseInt(newSlotId));
                alert('Reschedule successful!');
                loadBookings();
            } catch (err) {
                alert('Reschedule failed: ' + err.message);
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
