import { getMyBookings, cancelBooking, rescheduleBooking } from './api.js';

const customerId = localStorage.getItem('customerId');
if (!customerId) {
    console.warn('No customerId found, using mock data');
}

// Set to true to use mock data (useful when backend is unavailable)
const USE_MOCK = true;  // Change to false when backend is ready

async function loadBookings() {
    if (USE_MOCK) {
        // Mock data for demonstration
        const mockBookings = [
            { id: 1, specialistId: 1, topic: 'Career planning', status: 'CONFIRMED', timeSlotId: 101, date: '2026-05-10', timeSlot: '09:00-10:00' },
            { id: 2, specialistId: 2, topic: 'Anxiety management', status: 'PENDING', timeSlotId: 102, date: '2026-05-11', timeSlot: '14:00-15:00' },
            { id: 3, specialistId: 3, topic: 'Academic support', status: 'CANCELLED', timeSlotId: 103, date: '2026-05-09', timeSlot: '16:00-17:00' }
        ];
        renderBookings(mockBookings);
        return;
    }

    try {
        if (!customerId) {
            document.getElementById('bookingsList').innerHTML = '<p>Please login first.</p>';
            return;
        }
        const bookings = await getMyBookings(customerId);
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
    container.innerHTML = bookings.map(b => `
        <div class="booking-card" data-id="${b.id}">
            <p><strong>Specialist ID:</strong> ${b.specialistId}</p>
            <p><strong>Topic:</strong> ${b.topic || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status-${b.status}">${b.status}</span></p>
            <p><strong>Date:</strong> ${b.date || 'N/A'} ${b.timeSlot || ''}</p>
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
                if (!USE_MOCK) await cancelBooking(bookingId, parseInt(customerId), reason);
                alert('Cancelled');
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
                if (!USE_MOCK) await rescheduleBooking(bookingId, parseInt(customerId), parseInt(newSlotId));
                alert('Rescheduled');
                loadBookings();
            } catch (err) {
                alert(err.message);
            }
        });
    });
}

loadBookings();

// Logout button if exists
document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'login.html';
});
