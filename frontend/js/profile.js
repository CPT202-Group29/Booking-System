import { fetchProfile, updateProfile, uploadAvatar, changePassword, deleteAccount, logout, setCurrentUser, getCurrentUser } from './api.js';

// 从 localStorage 恢复用户
const storedUser = localStorage.getItem('user');
if (storedUser) setCurrentUser(JSON.parse(storedUser));

let currentProfile = null;

async function loadProfile() {
    try {
        currentProfile = await fetchProfile();
        document.getElementById('displayName').innerText = currentProfile.name;
        document.getElementById('displayEmail').innerText = currentProfile.email;
        document.getElementById('displayPhone').innerText = currentProfile.phone || '未设置';
        const avatarImg = document.getElementById('avatarImg');
        if (currentProfile.avatar) avatarImg.src = currentProfile.avatar;
        else avatarImg.src = 'https://via.placeholder.com/100';
    } catch (err) {
        showMessage('message', err.message, 'error');
    }
}

function showMessage(text, type) {
    const msgDiv = document.getElementById('message');
    msgDiv.innerHTML = `<div class="${type}">${text}</div>`;
    setTimeout(() => msgDiv.innerHTML = '', 3000);
}

// 编辑资料
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
        showMessage('资料更新成功', 'success');
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

// 修改密码
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
        showMessage('请填写完整', 'error');
        return;
    }
    if (newPwd !== confirm) {
        showMessage('新密码两次输入不一致', 'error');
        return;
    }
    try {
        await changePassword(oldPwd, newPwd);
        showMessage('密码修改成功，请重新登录', 'success');
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

// 删除账户
document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    const pwd = prompt('请输入您的密码以确认删除账户：');
    if (!pwd) return;
    try {
        await deleteAccount(pwd);
        showMessage('账户已删除', 'success');
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

// 登出
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

loadProfile();
