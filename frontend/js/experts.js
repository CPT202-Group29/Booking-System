import { getExperts } from './api.js';

let allExperts = [];

async function loadExperts(keyword = '') {
    try {
        allExperts = await getExperts();
        const filtered = keyword ? allExperts.filter(e => 
            e.name.toLowerCase().includes(keyword.toLowerCase()) ||
            e.expertise.toLowerCase().includes(keyword.toLowerCase())
        ) : allExperts;
        renderExperts(filtered);
    } catch (err) {
        document.getElementById('expertList').innerHTML = '<p>Error loading experts</p>';
    }
}

function renderExperts(experts) {
    const container = document.getElementById('expertList');
    if (!experts.length) {
        container.innerHTML = '<p>No experts found</p>';
        return;
    }
    container.innerHTML = experts.map(e => `
        <div class="expert-card">
            <h3>${e.name}</h3>
            <p>${e.expertise}</p>
            <p>$${e.fee}/hour</p>
            <button onclick="location.href='detail.html?id=${e.id}'">View Details</button>
        </div>
    `).join('');
}

document.getElementById('searchBtn')?.addEventListener('click', () => {
    loadExperts(document.getElementById('searchInput').value);
});
loadExperts();

// Logout
document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    location.href = 'login.html';
});
