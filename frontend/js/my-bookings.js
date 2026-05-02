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
    container.innerHTML = bookings.map(booking => {
        // Determine status class
        const statusClass = `status-${booking.status.toLowerCase()}`;
        // Display expert name if available, otherwise show specialistId
        const expertDisplay = booking.expertName || `Expert ID: ${booking.specialistId}`;
        // Display time slot description if available, otherwise show timeSlotId
        const timeDisplay = booking.timeSlotDescription || `Slot ID: ${booking.timeSlotId}`;
        
        return `
            <div class="booking-card" data-id="${booking.id}">
                <h3>${expertDisplay}</h3>
                <p><strong>Date & Time:</strong> ${booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'} | ${timeDisplay}</p>
                <p><strong>Topic:</strong> ${booking.topic || 'N/A'}</p>
                <p><strong>Notes:</strong> ${booking.notes || 'N/A'}</p>
                <p><strong>Charge:</strong> $${booking.chargeAmount ? booking.chargeAmount.toFixed(2) : '0.00'}</p>
                <p><strong>Status:</strong> <span class="${statusClass}">${booking.status}</span></p>
                ${booking.cancelReason ? `<p><strong>Cancel Reason:</strong> ${booking.cancelReason}</p>` : ''}
                <div class="button-group">
                    ${booking.status === 'CONFIRMED' ? `
                        <button class="btn-cancel" data-id="${booking.id}">Cancel</button>
                        <button class="btn-reschedule" data-id="${booking.id}">Reschedule</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Cancel button handlers
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

    // Reschedule button handlers
    document.querySelectorAll('.btn-reschedule').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const bookingId = parseInt(btn.dataset.id);
            // In a full implementation, you would fetch available slots for this expert.
            // For now, ask user to input new slot ID.
            const newSlotId = prompt('Please enter the new time slot ID:');
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
