import { getCustomer, updateCustomer } from './api.js';

const customerId = localStorage.getItem('customerId');
if (!customerId) location.href = 'login.html';

let profile = null;

async function loadProfile() {
    try {
        profile = await getCustomer(customerId);
        document.getElementById('displayName').innerText = profile.name || 'N/A';
        document.getElementById('displayPhone').innerText = profile.phone || 'N/A';
        document.getElementById('displayUsername').innerText = localStorage.getItem('username') || '';
        document.getElementById('displayRole').innerText = localStorage.getItem('role') || '';
    } catch (err) {
        document.getElementById('profileView').innerHTML = '<p>Error loading profile</p>';
    }
}

document.getElementById('editBtn').addEventListener('click', () => {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editName').value = profile.name || '';
    document.getElementById('editPhone').value = profile.phone || '';
});
document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('editForm').style.display = 'none';
    document.getElementById('profileView').style.display = 'block';
});
document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    try {
        await updateCustomer(customerId, name, phone);
        await loadProfile();
        document.getElementById('editForm').style.display = 'none';
        document.getElementById('profileView').style.display = 'block';
        document.getElementById('message').innerHTML = '<div class="success">Profile updated</div>';
        setTimeout(() => document.getElementById('message').innerHTML = '', 2000);
    } catch (err) {
        document.getElementById('message').innerHTML = `<div class="error">${err.message}</div>`;
    }
});

// Placeholders for missing backend features
document.getElementById('changePwdBtn').addEventListener('click', () => {
    alert('Change password feature will be available soon (backend missing).');
});
document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    alert('Delete account feature will be available soon (backend missing).');
});
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    location.href = 'login.html';
});

loadProfile();
