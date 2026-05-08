const API_BASE = "http://121.196.221.244:8080";

// 创建专家
export async function createSpecialist(data) {
    const response = await fetch(`${API_BASE}/api/v1/specialists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create specialist');
    }
    return response.json();
}

// 获取所有专家
export async function getSpecialists() {
    const response = await fetch(`${API_BASE}/api/v1/specialists`);
    if (!response.ok) throw new Error('Failed to fetch specialists');
    return response.json();
}

// 更新专家
export async function updateSpecialist(id, data) {
    const response = await fetch(`${API_BASE}/api/v1/specialists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update specialist');
    }
    return response.json();
}

// 删除专家
export async function deleteSpecialist(id) {
    const response = await fetch(`${API_BASE}/api/v1/specialists/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete specialist');
    }
    return response.json();
}
