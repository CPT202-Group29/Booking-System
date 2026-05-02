// ---------- Mock Database ----------
let mockUsers = [
    { id: 1, name: 'Zhang San', email: 'test@example.com', password: '123456', phone: '', avatar: '', role: 'CUSTOMER', failedAttempts: 0, lockedUntil: null }
];
let mockVerificationCodes = {};

function saveUsers() {
    localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
}
function loadUsers() {
    const stored = localStorage.getItem('mockUsers');
    if (stored) mockUsers = JSON.parse(stored);
}
loadUsers();

// ---------- Registration ----------
export async function sendVerificationCode(email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    mockVerificationCodes[email] = { code, expireTime: Date.now() + 5 * 60 * 1000 };
    console.log(`Verification code for ${email}: ${code}`);
    return { success: true, message: 'Verification code sent' };
}

export async function register(name, email, password, verificationCode) {
    const record = mockVerificationCodes[email];
    if (!record || record.code !== verificationCode || Date.now() > record.expireTime) {
        throw new Error('Invalid or expired verification code');
    }
    if (mockUsers.find(u => u.email === email)) {
        throw new Error('Email already registered');
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
        throw new Error('Password must be at least 6 characters and contain both letters and numbers');
    }
    const newUser = {
        id: mockUsers.length + 1,
        name,
        email,
        password,
        phone: '',
        avatar: '',
        role: 'CUSTOMER',
        failedAttempts: 0,
        lockedUntil: null
    };
    mockUsers.push(newUser);
    saveUsers();
    delete mockVerificationCodes[email];
    return { success: true, message: 'Registration successful' };
}

// ---------- Login ----------
export async function login(email, password) {
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
        throw new Error('Invalid email or password');
    }
    if (user.lockedUntil && Date.now() < user.lockedUntil) {
        throw new Error('Account locked, please try again after 15 minutes');
    }
    if (user.password !== password) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= 5) {
            user.lockedUntil = Date.now() + 15 * 60 * 1000;
            user.failedAttempts = 0;
            saveUsers();
            throw new Error('Too many failed attempts. Account locked for 15 minutes');
        }
        saveUsers();
        throw new Error('Invalid email or password');
    }
    user.failedAttempts = 0;
    user.lockedUntil = null;
    saveUsers();
    const token = 'fake-jwt-token-' + Date.now();
    const userInfo = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar };
    return { token, user: userInfo };
}

export async function logout() {
    return { success: true };
}

// ---------- Forgot Password ----------
export async function sendResetCode(email) {
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
        throw new Error('Email not registered');
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    mockVerificationCodes[email] = { code, expireTime: Date.now() + 5 * 60 * 1000 };
    console.log(`Reset code for ${email}: ${code}`);
    return { success: true };
}

export async function resetPassword(email, verificationCode, newPassword) {
    const record = mockVerificationCodes[email];
    if (!record || record.code !== verificationCode || Date.now() > record.expireTime) {
        throw new Error('Invalid or expired verification code');
    }
    const user = mockUsers.find(u => u.email === email);
    if (!user) throw new Error('User not found');
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new Error('Password must be at least 6 characters and contain both letters and numbers');
    }
    user.password = newPassword;
    saveUsers();
    delete mockVerificationCodes[email];
    return { success: true };
}

// ---------- Profile ----------
let currentUser = null;
export function setCurrentUser(user) {
    currentUser = user;
}
export function getCurrentUser() {
    return currentUser;
}
export async function fetchProfile() {
    if (!currentUser) throw new Error('Not logged in');
    const user = mockUsers.find(u => u.id === currentUser.id);
    if (!user) throw new Error('User not found');
    return { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar };
}
export async function updateProfile(name, phone) {
    if (!currentUser) throw new Error('Not logged in');
    const user = mockUsers.find(u => u.id === currentUser.id);
    if (name) user.name = name;
    if (phone) {
        if (!/^\d{10,15}$/.test(phone)) throw new Error('Invalid phone number (10-15 digits)');
        user.phone = phone;
    }
    saveUsers();
    currentUser.name = user.name;
    currentUser.phone = user.phone;
    return { name: user.name, phone: user.phone };
}
export async function uploadAvatar(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarUrl = e.target.result;
            const user = mockUsers.find(u => u.id === currentUser.id);
            user.avatar = avatarUrl;
            saveUsers();
            currentUser.avatar = avatarUrl;
            resolve({ avatarUrl });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
export async function changePassword(oldPassword, newPassword) {
    if (!currentUser) throw new Error('Not logged in');
    const user = mockUsers.find(u => u.id === currentUser.id);
    if (user.password !== oldPassword) throw new Error('Old password is incorrect');
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) throw new Error('New password must be at least 6 characters and contain both letters and numbers');
    user.password = newPassword;
    saveUsers();
    return { success: true };
}
export async function deleteAccount(password) {
    if (!currentUser) throw new Error('Not logged in');
    const user = mockUsers.find(u => u.id === currentUser.id);
    if (user.password !== password) throw new Error('Incorrect password');
    const index = mockUsers.findIndex(u => u.id === currentUser.id);
    mockUsers.splice(index, 1);
    saveUsers();
    return { success: true };
}
// ---------- Bookings API ----------
// Get current user's bookings (replace URL with actual backend endpoint)
export async function getMyBookings() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('/api/bookings/my', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch bookings');
    }
    return response.json(); // Expected array of bookings
}

// Cancel a booking
export async function cancelBooking(bookingId, cancelReason) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);

    const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            user_id: user.id,
            cancel_reason: cancelReason
        })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Cancel failed');
    }
    return response.json(); // { message: "..." }
}

// Reschedule a booking
export async function rescheduleBooking(bookingId, newSlotId) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);

    const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            user_id: user.id,
            new_slot_id: newSlotId
        })
    });
    if (response.status === 409) {
        throw new Error('Conflict: This time slot has just been taken by another user');
    }
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Reschedule failed');
    }
    return response.json(); // Success message
}

// Get current user's bookings using real backend
export async function getMyBookings() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const userId = user.userId || user.id;        // adapt to your actual field name
    if (!userId) throw new Error('User ID not found');

    const response = await fetch(`/api/v1/bookings?customerId=${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch bookings');
    }
    return response.json();   // array of booking objects
}

// Cancel booking (your existing interface, keep as is)
export async function cancelBooking(bookingId, cancelReason) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const userId = user.userId || user.id;

    const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            user_id: userId,
            cancel_reason: cancelReason
        })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Cancel failed');
    }
    return response.json();
}

// Reschedule booking (your existing interface)
export async function rescheduleBooking(bookingId, newSlotId) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const userId = user.userId || user.id;

    const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            user_id: userId,
            new_slot_id: newSlotId
        })
    });
    if (response.status === 409) {
        throw new Error('Conflict: This time slot has just been taken by another user');
    }
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Reschedule failed');
    }
    return response.json();
}
