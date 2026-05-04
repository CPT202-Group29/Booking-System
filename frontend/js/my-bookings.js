import { getMyBookings, cancelBooking, rescheduleBooking } from './api.js';

const customerId = localStorage.getItem('customerId');
if (!customerId) location.href = 'login.html';

async function loadBookings() {
    try {
        const bookings = await getMyBookings(customerId);
        renderBookings(bookings);
    } catch (err) {
        document.getElementById('bookingsList').innerHTML = `<p class="error">${err.message}</p>`;
    }
}

function renderBookings(bookings) {
    const container = document.getElementById('bookingsList');
    if (!bookings.length) {
        container.innerHTML = '<p>No bookings found</p>';
        return;
    }
    container.innerHTML = bookings.map(b => `
        <div class="booking-card">
            <p><strong>Booking ID:</strong> ${b.id}</p>
            <p><strong>Specialist ID:</strong> ${b.specialistId}</p>
            <p><strong>Topic:</strong> ${b.topic || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status-${b.status}">${b.status}</span></p>
            <p><strong>Time Slot:</strong> ${b.timeSlotId}</p>
            ${b.status === 'CONFIRMED' ? `
                <button class="btn-cancel" data-id="${b.id}">Cancel</button>
                <button class="btn-reschedule" data-id="${b.id}">Reschedule</button>
            ` : ''}
        </div>
    `).join('');

    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', async () => {
            const bookingId = parseInt(btn.dataset.id);
            const reason = prompt('Cancel reason:');
            if (!reason) return;
            try {
                await cancelBooking(bookingId, parseInt(customerId), reason);
                alert('Cancelled successfully');
                loadBookings();
            } catch (err) {
                alert(err.message);
            }
        });
    });

    document.querySelectorAll('.btn-reschedule').forEach(btn => {
        btn.addEventListener('click', async () => {
            const bookingId = parseInt(btn.dataset.id);
            const newSlotId = prompt('Enter new time slot ID:');
            if (!newSlotId || isNaN(parseInt(newSlotId))) return;
            try {
                await rescheduleBooking(bookingId, parseInt(customerId), parseInt(newSlotId));
                alert('Rescheduled successfully');
                loadBookings();
            } catch (err) {
                alert(err.message);
            }
        });
    });
}

loadBookings();

document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    location.href = 'login.html';
});
