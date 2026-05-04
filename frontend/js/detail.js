import { getExpertById, getAvailableSlots, createBooking } from './api.js';

const urlParams = new URLSearchParams(window.location.search);
const expertId = urlParams.get('id');
if (!expertId) location.href = 'index.html';

let expert = null;

async function loadExpert() {
    try {
        expert = await getExpertById(expertId);
        document.getElementById('expertInfo').innerHTML = `
            <div class="expert-card">
                <h3>${expert.name}</h3>
                <p>Expertise: ${expert.expertise}</p>
                <p>Fee: $${expert.fee}/hour</p>
                <p>${expert.description || ''}</p>
            </div>
        `;
    } catch (err) {
        document.getElementById('expertInfo').innerHTML = '<p>Expert not found</p>';
    }
}
loadExpert();

const dateInput = document.getElementById('date');
const timeSlotSelect = document.getElementById('timeSlot');
dateInput.min = new Date().toISOString().split('T')[0];

dateInput.addEventListener('change', async () => {
    const date = dateInput.value;
    if (!date) return;
    try {
        const slots = await getAvailableSlots(expertId, date);
        timeSlotSelect.innerHTML = '<option value="">Select time slot</option>';
        slots.forEach(slot => {
            const opt = document.createElement('option');
            opt.value = slot.id;
            opt.textContent = slot.display;
            timeSlotSelect.appendChild(opt);
        });
    } catch (err) {
        timeSlotSelect.innerHTML = '<option>No slots available</option>';
    }
});

document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const customerId = localStorage.getItem('customerId');
    if (!customerId) {
        alert('Please login first');
        location.href = 'login.html';
        return;
    }
    const date = dateInput.value;
    const timeSlotId = timeSlotSelect.value;
    const topic = document.getElementById('topic').value.trim();
    if (!date || !timeSlotId || !topic) {
        alert('Please complete all fields');
        return;
    }
    try {
        await createBooking(parseInt(customerId), parseInt(expertId), parseInt(timeSlotId), topic);
        document.getElementById('message').innerHTML = '<div class="success">Booking created! Status: PENDING</div>';
        setTimeout(() => location.href = 'my-bookings.html', 1500);
    } catch (err) {
        document.getElementById('message').innerHTML = `<div class="error">${err.message}</div>`;
    }
});
