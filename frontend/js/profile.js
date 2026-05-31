import { fetchProfile, updateProfile, uploadAvatar, changePassword, deleteAccount, logout } from './api.js';

let currentProfile = null;

async function loadProfile() {
    try {
        currentProfile = await fetchProfile();
        document.getElementById('displayName').innerText = currentProfile.username || '';
        document.getElementById('displayEmail').innerText = currentProfile.email || '';
        document.getElementById('displayPhone').innerText = currentProfile.phone || '';
        const avatarImg = document.getElementById('avatarImg');
        if (currentProfile.avatar) avatarImg.src = currentProfile.avatar;
        else avatarImg.src = 'https://via.placeholder.com/100';
    } catch (err) {
        showMessage(err.message, 'error');
    }
}

function showMessage(text, type) {
    const div = document.getElementById('message');
    div.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => div.innerHTML = '', 3000);
}

// Edit mode
document.getElementById('editBtn')?.addEventListener('click', () => {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editName').value = currentProfile.username || '';
    document.getElementById('editPhone').value = currentProfile.phone || '';
});
document.getElementById('cancelBtn')?.addEventListener('click', () => {
    document.getElementById('editForm').style.display = 'none';
    document.getElementById('profileView').style.display = 'block';
});
document.getElementById('saveBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const file = document.getElementById('avatarFile').files[0];
    try {
        await updateProfile(name, phone);
        if (file) await uploadAvatar(file);
        await loadProfile();
        document.getElementById('editForm').style.display = 'none';
        document.getElementById('profileView').style.display = 'block';
        showMessage('Profile updated', 'success');
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

// Change password
document.getElementById('changePwdBtn')?.addEventListener('click', () => {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('changePwdForm').style.display = 'block';
});
document.getElementById('cancelPwdBtn')?.addEventListener('click', () => {
    document.getElementById('changePwdForm').style.display = 'none';
    document.getElementById('profileView').style.display = 'block';
});
document.getElementById('submitPwdBtn')?.addEventListener('click', async () => {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;
    if (!oldPassword || !newPassword || !confirm) {
        showMessage('Please fill all fields', 'error');
        return;
    }
    if (newPassword !== confirm) {
        showMessage('New passwords do not match', 'error');
        return;
    }
    try {
        await changePassword(oldPassword, newPassword);
        showMessage('Password changed. Please login again.', 'success');
        setTimeout(async () => {
            await logout();
            window.location.href = 'login.html';
        }, 1500);
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

// Delete account
document.getElementById('deleteAccountBtn')?.addEventListener('click', async () => {
    const pwd = prompt('Please enter your password to confirm account deletion:');
    if (!pwd) return;
    try {
        await deleteAccount(pwd);
        showMessage('Account deleted', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await logout();
    window.location.href = 'login.html';
});

loadProfile();
