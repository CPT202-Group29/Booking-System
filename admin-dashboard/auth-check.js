// ==========================================
// Admin Authentication Check
// 必须在所有后台页面 <head> 中最早引入
// ==========================================

(function() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // 未登录 → 跳转登录页
    if (!token || !userStr) {
        window.location.replace('/login.html');
        return;
    }

    // 已登录但非管理员 → 提示并跳转
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'ADMIN') {
            alert('Access denied. Admin only.');
            window.location.replace('/login.html');
        }
    } catch (e) {
        // JSON 解析失败 → 跳转登录页
        window.location.replace('/login.html');
    }
})();


function goBackFromAdmin() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "../frontend/index.html";
  }
}
