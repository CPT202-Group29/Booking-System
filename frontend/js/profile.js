import { getCustomerByUserId, updateCustomer, uploadAvatar, updatePassword, deleteAccount } from './api.js';

const userId = localStorage.getItem('userId');
if (!userId) location.href = 'login.html';

let customer = null;

async function loadProfile() {
    try {
        const data = await getCustomerByUserId(userId);
        customer = data;  // contains id, name, phone, avatarUrl, etc.
        document.getElementById('displayName').innerText = customer.name || '';
        document.getElementById('displayPhone').innerText = customer.phone || '';
        document.getElementById('displayUsername').innerText = localStorage.getItem('username') || '';
        document.getElementById('displayRole').innerText = localStorage.getItem('role') || '';
        const avatarImg = document.getElementById('avatarImg');
        if (customer.avatarUrl) avatarImg.src = API_BASE + customer.avatarUrl;
        else avatarImg.src = 'https://via.placeholder.com/100';
    } catch (err) {
        document.getElementById('profileView').innerHTML = '<p>Failed to load profile</p>';
    }
}

function showMessage(text, type) {
    const div = document.getElementById('message');
    div.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => div.innerHTML = '', 3000);
}

// Edit mode
document.getElementById('editBtn').addEventListener('click', () => {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editName').value = customer.name || '';
    document.getElementById('editPhone').value = customer.phone || '';
});
document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('editForm').style.display = 'none';
    document.getElementById('profileView').style.display = 'block';
});
document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const file = document.getElementById('avatarFile').files[0];
    try {
        await updateCustomer(customer.id, name, phone);
        if (file) {
            await uploadAvatar(customer.id, file);
        }
        await loadProfile();
        document.getElementById('editForm').style.display = 'none';
        document.getElementById('profileView').style.display = 'block';
        showMessage('Profile updated', 'success');
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

// Change password
document.getElementById('changePwdBtn').addEventListener('click', () => {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('changePwdForm').style.display = 'block';
});
document.getElementById('cancelPwdBtn').addEventListener('click', () => {
    document.getElementById('changePwdForm').style.display = 'none';
    document.getElementById('profileView').style.display = 'block';
});
document.getElementById('submitPwdBtn').addEventListener('click', async () => {
    const newPassword = document.getElementById('newPassword').value;
    if (!newPassword || newPassword.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }
    try {
        await updatePassword(userId, newPassword);
        showMessage('Password updated. Please login again.', 'success');
        setTimeout(() => {
            localStorage.clear();
            location.href = 'login.html';
        }, 1500);
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

// Delete account
document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete your account? This action is permanent.')) return;
    try {
        await deleteAccount(userId);
        showMessage('Account deleted', 'success');
        setTimeout(() => {
            localStorage.clear();
            location.href = 'login.html';
        }, 1500);
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    location.href = 'login.html';
});

loadProfile();
