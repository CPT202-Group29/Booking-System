import {
    getSpecialistBookings, confirmBookingBySpecialist, completeBookingBySpecialist, cancelBookingBySpecialist,
    getSpecialistSlots, addSpecialistSlot, deleteSpecialistSlot,
    getSpecialistProfile, updateSpecialistProfile
} from './api.js';

const userStr = localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;
if (!user || user.role !== 'SPECIALIST') {
    alert('Access denied. Only specialists can view this page.');
    window.location.href = 'login.html';
}
const specialistId = user.specialistId;
if (!specialistId) {
    alert('Invalid specialist data. Please login again.');
    window.location.href = 'login.html';
}

function showMessage(text, type, isTemporary = true) {
    const msgDiv = document.getElementById('message');
    msgDiv.innerHTML = `<div class="${type}">${text}</div>`;
    if (isTemporary) setTimeout(() => msgDiv.innerHTML = '', 5000);
}

// 加载预约日程
async function loadBookings() {
    try {
        const bookings = await getSpecialistBookings(specialistId);
        const container = document.getElementById('bookingsList');
        if (!bookings.length) {
            container.innerHTML = '<p>No appointments found.</p>';
            return;
        }
        container.innerHTML = `
            <table>
                <thead><tr><th>Date</th><th>Time</th><th>Customer</th><th>Topic</th><th>Fee</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${bookings.map(b => `
                    <tr>
                        <td>${b.date || ''}</td>
                        <td>${b.time || ''}</td>
                        <td>${b.customerName || b.customerId || ''}</td>
                        <td>${b.topic || ''}</td>
                        <td>$${b.fee || b.chargeAmount || 0}</td>
                        <td class="status-${b.status}">${b.status}</td>
                        <td>
                            ${b.status === 'PENDING' ? `<button class="confirm-btn" data-id="${b.id}">Confirm</button>` : ''}
                            ${b.status === 'CONFIRMED' ? `<button class="complete-btn" data-id="${b.id}">Complete</button>` : ''}
                            ${(b.status === 'PENDING' || b.status === 'CONFIRMED') ? `<button class="cancel-btn" data-id="${b.id}">Cancel</button>` : ''}
                        </td>
                    </tr>
                `).join('')}</tbody>
            </table>
        `;
        // 绑定事件
        document.querySelectorAll('.confirm-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                if (confirm('Confirm this booking?')) {
                    try {
                        await confirmBookingBySpecialist(id);
                        loadBookings();
                    } catch (err) { showMessage(err.message, 'error'); }
                }
            });
        });
        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                if (confirm('Mark as completed?')) {
                    try {
                        await completeBookingBySpecialist(id);
                        loadBookings();
                    } catch (err) { showMessage(err.message, 'error'); }
                }
            });
        });
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const reason = prompt('Please provide cancellation reason:');
                if (!reason) return;
                const id = parseInt(btn.dataset.id);
                try {
                    await cancelBookingBySpecialist(id, reason);
                    loadBookings();
                } catch (err) { showMessage(err.message, 'error'); }
            });
        });
    } catch (err) {
        document.getElementById('bookingsList').innerHTML = `<p>Error loading bookings: ${err.message}</p>`;
    }
}

// 加载时间段
async function loadSlots() {
    try {
        const slots = await getSpecialistSlots(specialistId);
        const container = document.getElementById('slotsList');
        if (!slots.length) {
            container.innerHTML = '<p>No time slots added yet.</p>';
            return;
        }
        container.innerHTML = `
            <table>
                <thead><tr><th>Start Time</th><th>End Time</th><th>Available</th><th>Action</th></tr></thead>
                <tbody>${slots.map(slot => `
                    <tr>
                        <td>${new Date(slot.startTime).toLocaleString()}</td>
                        <td>${new Date(slot.endTime).toLocaleString()}</td>
                        <td>${slot.isAvailable ? 'Yes' : 'No'}</td>
                        <td>${slot.isAvailable ? `<button class="delete-slot" data-id="${slot.id}">Delete</button>` : ''}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        `;
        document.querySelectorAll('.delete-slot').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Delete this time slot?')) {
                    try {
                        await deleteSpecialistSlot(parseInt(btn.dataset.id));
                        loadSlots();
                    } catch (err) { showMessage(err.message, 'error'); }
                }
            });
        });
    } catch (err) {
        document.getElementById('slotsList').innerHTML = `<p>Error loading slots: ${err.message}</p>`;
    }
}

// 添加时段
document.getElementById('addSlotBtn')?.addEventListener('click', async () => {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    if (!startTime || !endTime) {
        showMessage('Please fill both start and end time', 'error');
        return;
    }
    const startISO = new Date(startTime).toISOString();
    const endISO = new Date(endTime).toISOString();
    if (new Date(startISO) >= new Date(endISO)) {
        showMessage('Start time must be before end time', 'error');
        return;
    }
    try {
        await addSpecialistSlot(specialistId, startISO, endISO);
        showMessage('Slot added successfully', 'success');
        document.getElementById('startTime').value = '';
        document.getElementById('endTime').value = '';
        loadSlots();
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

// 加载个人资料
async function loadProfile() {
    try {
        const profile = await getSpecialistProfile(specialistId);
        document.getElementById('level').innerText = profile.level || 'N/A';
        document.getElementById('fee').innerText = profile.fee || '0';
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileContact').value = profile.contact || '';
        document.getElementById('profileDescription').value = profile.description || '';
    } catch (err) {
        showMessage('Failed to load profile: ' + err.message, 'error');
    }
}

document.getElementById('updateProfileBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('profileName').value.trim();
    const contact = document.getElementById('profileContact').value.trim();
    const description = document.getElementById('profileDescription').value.trim();
    try {
        await updateSpecialistProfile(specialistId, name, contact, description);
        showMessage('Profile updated successfully', 'success');
        loadProfile(); // 刷新只读部分
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

// Tab 切换
const navLinks = document.querySelectorAll('.sidebar nav a[data-tab]');
const tabs = { bookings: 'bookingsTab', slots: 'slotsTab', profile: 'profileTab' };
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.dataset.tab;
        Object.values(tabs).forEach(id => document.getElementById(id).classList.remove('active'));
        document.getElementById(tabs[tab]).classList.add('active');
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        if (tab === 'bookings') loadBookings();
        else if (tab === 'slots') loadSlots();
        else if (tab === 'profile') loadProfile();
    });
});

// 登出
document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'login.html';
});

// 初始加载
loadBookings();
loadSlots();
loadProfile();
