import { getMyBookings, cancelBooking, rescheduleBooking } from './api.js';

async function loadBookings() {
    const container = document.getElementById('bookingsList');
    container.innerHTML = 'Loading...';
    try {
        const bookings = await getMyBookings();
        if (!bookings.length) {
            container.innerHTML = '<p>No appointments found.</p>';
            return;
        }
        renderBookings(bookings);
    } catch (err) {
        container.innerHTML = `<p class="error">Error loading bookings: ${err.message}</p>`;
    }
}

function renderBookings(bookings) {
    const container = document.getElementById('bookingsList');
    container.innerHTML = bookings.map(booking => `
        <div class="booking-card" data-id="${booking.id}">
            <h3>${booking.expertName || 'Expert'}</h3>
            <p><strong>Date & Time:</strong> ${booking.date} ${booking.timeSlot || ''}</p>
            <p><strong>Topic:</strong> ${booking.topic || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status-${booking.status.toLowerCase()}">${booking.status}</span></p>
            <div class="button-group">
                ${booking.status === 'Confirmed' ? `
                    <button class="btn-cancel" data-id="${booking.id}">Cancel</button>
                    <button class="btn-reschedule" data-id="${booking.id}">Reschedule</button>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Attach event listeners
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const bookingId = parseInt(btn.dataset.id);
            const reason = prompt('Please enter the cancellation reason:');
            if (!reason) return;
            try {
                const result = await cancelBooking(bookingId, reason);
                alert(result.message || 'Booking cancelled successfully');
                loadBookings(); // Refresh list
            } catch (err) {
                alert('Cancel failed: ' + err.message);
            }
        });
    });

    document.querySelectorAll('.btn-reschedule').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const bookingId = parseInt(btn.dataset.id);
            // For simplicity, prompt user to enter new slot ID.
            // In a real app, you would fetch available slots and let the user choose.
            const newSlotId = prompt('Please enter the new time slot ID (e.g., 2):');
            if (!newSlotId || isNaN(parseInt(newSlotId))) {
                alert('Invalid slot ID');
                return;
            }
            try {
                const result = await rescheduleBooking(bookingId, parseInt(newSlotId));
                alert('Reschedule successful!');
                loadBookings();
            } catch (err) {
                alert('Reschedule failed: ' + err.message);
            }
        });
    });
}

// Logout
document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

loadBookings();
