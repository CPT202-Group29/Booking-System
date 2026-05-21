import { fetchProfile, updateProfile, uploadAvatar, changePassword, deleteAccount, logout, setCurrentUser, getCurrentUser } from './api.js';

const storedUser = localStorage.getItem('user');
if (storedUser) setCurrentUser(JSON.parse(storedUser));

let currentProfile = null;

async function loadProfile() {
    try {
        currentProfile = await fetchProfile();
        document.getElementById('displayName').innerText = currentProfile.name;
        document.getElementById('displayEmail').innerText = currentProfile.email;
        document.getElementById('displayPhone').innerText = currentProfile.phone || 'Not set';
        const avatarImg = document.getElementById('avatarImg');
        if (currentProfile.avatar) avatarImg.src = currentProfile.avatar;
        else avatarImg.src = 'https://via.placeholder.com/100';
    } catch (err) {
        showMessage(err.message, 'error');
    }
}

function showMessage(text, type) {
    const msgDiv = document.getElementById('message');
    msgDiv.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => msgDiv.innerHTML = '', 3000);
}

document.getElementById('editBtn').addEventListener('click', () => {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editName').value = currentProfile.name;
    document.getElementById('editPhone').value = currentProfile.phone || '';
});
document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('editForm').style.display = 'none';
    document.getElementById('profileView').style.display = 'block';
});
document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const avatarFile = document.getElementById('avatarFile').files[0];
    try {
        if (name || phone) {
            await updateProfile(name, phone);
        }
        if (avatarFile) {
            await uploadAvatar(avatarFile);
        }
        await loadProfile();
        document.getElementById('editForm').style.display = 'none';
        document.getElementById('profileView').style.display = 'block';
        showMessage('Profile updated successfully', 'success');
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

document.getElementById('changePwdBtn').addEventListener('click', () => {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('changePwdForm').style.display = 'block';
});
document.getElementById('cancelPwdBtn').addEventListener('click', () => {
    document.getElementById('changePwdForm').style.display = 'none';
    document.getElementById('profileView').style.display = 'block';
});
document.getElementById('submitPwdBtn').addEventListener('click', async () => {
    const oldPwd = document.getElementById('oldPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;
    if (!oldPwd || !newPwd || !confirm) {
        showMessage('Please fill all fields', 'error');
        return;
    }
    if (newPwd !== confirm) {
        showMessage('New passwords do not match', 'error');
        return;
    }
    try {
        await changePassword(oldPwd, newPwd);
        showMessage('Password changed. Please login again.', 'success');
        setTimeout(async () => {
            await logout();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }, 1500);
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    const pwd = prompt('Please enter your password to confirm account deletion:');
    if (!pwd) return;
    try {
        await deleteAccount(pwd);
        showMessage('Account deleted', 'success');
        setTimeout(async () => {
            await logout();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }, 1500);
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

loadProfile();
