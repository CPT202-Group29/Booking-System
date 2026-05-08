// ===============================
// Booking Management - Admin Dashboard
// ===============================

const API_BASE_URL = "http://121.196.221.244:8080/api/v1";

let bookings = [];

const bookingTableBody = document.getElementById("bookingTableBody");
const bookingStatusFilter = document.getElementById("bookingStatusFilter");
const refreshBtn = document.getElementById("refreshBtn");

const totalBookings = document.getElementById("totalBookings");
const pendingBookings = document.getElementById("pendingBookings");
const confirmedBookings = document.getElementById("confirmedBookings");
const completedBookings = document.getElementById("completedBookings");

// 动态注入日志模态框样式
(function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      padding: 25px;
      border-radius: 12px;
      max-width: 700px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      position: relative;
    }
    .modal-content h3 {
      margin-top: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-content table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .modal-content th, .modal-content td {
      padding: 10px 8px;
      border-bottom: 1px solid #eee;
      text-align: left;
      font-size: 14px;
    }
    .modal-content th {
      background: #f8f9fa;
      font-weight: 600;
    }
    .modal-content .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }
    .logs-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      margin-left: 4px;
    }
    .logs-btn:hover {
      background: #5a6268;
    }
  `;
  document.head.appendChild(style);
})();

// 状态映射工具函数
function normalizeStatus(status) {
  if (!status) return "";
  const upperStatus = status.toString().toUpperCase();
  if (upperStatus === "PENDING") return "Pending";
  if (upperStatus === "CONFIRMED") return "Confirmed";
  if (upperStatus === "CANCELLED") return "Cancelled";
  if (upperStatus === "COMPLETED") return "Completed";
  return status;
}

function toBackendStatus(status) {
  if (status === "Pending") return "PENDING";
  if (status === "Confirmed") return "CONFIRMED";
  if (status === "Cancelled") return "CANCELLED";
  if (status === "Completed") return "COMPLETED";
  return status.toUpperCase();
}

function getStatusClass(status) {
  return normalizeStatus(status).toLowerCase();
}

function mapBookingFromBackend(booking) {
  return {
    id: booking.id,
    customer: booking.customerName || booking.customer || booking.customerId || "Unknown Customer",
    specialist: booking.specialistName || booking.specialist || booking.specialistId || "Unknown Specialist",
    topic: booking.topic || booking.notes || booking.description || "-",
    date: booking.date || booking.bookingDate || booking.slotDate || "-",
    time: booking.time || booking.bookingTime || booking.slotTime || "-",
    fee: booking.fee || booking.price || booking.amount || 0,
    status: normalizeStatus(booking.status)
  };
}

// 加载预约数据
async function loadBookings() {
  try {
    const selectedStatus = bookingStatusFilter.value;
    let url = `${API_BASE_URL}/bookings`;
    if (selectedStatus !== "All") {
      url += `?status=${toBackendStatus(selectedStatus)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load bookings. Status: ${response.status}`);
    }
    const data = await response.json();
    bookings = Array.isArray(data) ? data.map(mapBookingFromBackend) : [];
    renderBookings();
    updateStats();
  } catch (error) {
    console.error("Error loading bookings:", error);
    alert("Failed to load booking data. Please check whether the backend is running.");
  }
}

// 渲染表格
function renderBookings() {
  bookingTableBody.innerHTML = "";
  if (bookings.length === 0) {
    bookingTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#6b7280;">No booking records found.</td></tr>`;
    return;
  }
  bookings.forEach((booking) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${booking.id}</td>
      <td>${booking.customer}</td>
      <td>${booking.specialist}</td>
      <td>${booking.topic}</td>
      <td>${booking.date}</td>
      <td>${booking.time}</td>
      <td>£${booking.fee}</td>
      <td><span class="badge ${getStatusClass(booking.status)}">${booking.status}</span></td>
      <td>${renderActionButtons(booking)}</td>
    `;
    bookingTableBody.appendChild(row);
  });
}

// 根据状态渲染操作按钮（包含Logs按钮）
function renderActionButtons(booking) {
  const logsBtn = `<button class="logs-btn" onclick="viewLogs(${booking.id})">Logs</button>`;
  if (booking.status === "Pending") {
    return `
      <button class="table-btn confirm-btn" onclick="confirmBooking(${booking.id})">Confirm</button>
      <button class="table-btn cancel-btn" onclick="cancelBooking(${booking.id})">Cancel</button>
      ${logsBtn}
    `;
  }
  if (booking.status === "Confirmed") {
    return `
      <button class="table-btn complete-btn" onclick="completeBooking(${booking.id})">Complete</button>
      <button class="table-btn cancel-btn" onclick="cancelBooking(${booking.id})">Cancel</button>
      ${logsBtn}
    `;
  }
  // Completed / Cancelled 只显示Logs按钮
  return logsBtn;
}

// 操作函数
async function confirmBooking(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/confirm`, { method: "PUT" });
    if (!response.ok) throw new Error(`Confirm failed. Status: ${response.status}`);
    await loadBookings();
  } catch (error) {
    console.error(error);
    alert("Failed to confirm booking.");
  }
}

async function completeBooking(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/complete`, { method: "PUT" });
    if (!response.ok) throw new Error(`Complete failed. Status: ${response.status}`);
    await loadBookings();
  } catch (error) {
    console.error(error);
    alert("Failed to complete booking.");
  }
}

async function cancelBooking(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/admin-cancel`, { method: "POST" });
    if (!response.ok) throw new Error(`Cancel failed. Status: ${response.status}`);
    await loadBookings();
  } catch (error) {
    console.error(error);
    alert("Failed to cancel booking.");
  }
}

// 查看日志并弹出模态框
async function viewLogs(bookingId) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/logs`);
    if (!response.ok) throw new Error("Failed to load logs");
    const logs = await response.json();

    // 创建模态框元素
    let modal = document.getElementById("logModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "logModal";
      modal.className = "modal-overlay";
      modal.innerHTML = `
        <div class="modal-content">
          <h3>
            <span>📋 Booking Status Logs</span>
            <button class="close-btn" onclick="document.getElementById('logModal').style.display='none'">&times;</button>
          </h3>
          <div id="logContent"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const logContent = document.getElementById("logContent");
    if (logs.length === 0) {
      logContent.innerHTML = "<p style='text-align:center;color:#6b7280;'>No status change logs found.</p>";
    } else {
      let html = `<table>
        <thead><tr><th>Time</th><th>Previous</th><th>New</th><th>By</th><th>Reason</th></tr></thead>
        <tbody>`;
      logs.forEach(log => {
        html += `<tr>
          <td>${new Date(log.changedAt).toLocaleString()}</td>
          <td>${log.previousStatus || 'N/A'}</td>
          <td>${log.newStatus}</td>
          <td>${log.changedBy || 'System'}</td>
          <td>${log.reason || '-'}</td>
        </tr>`;
      });
      html += "</tbody></table>";
      logContent.innerHTML = html;
    }

    modal.style.display = "flex";
  } catch (error) {
    console.error(error);
    alert("Failed to load logs.");
  }
}

// 更新统计卡片
function updateStats() {
  totalBookings.textContent = bookings.length;
  pendingBookings.textContent = bookings.filter(b => b.status === "Pending").length;
  confirmedBookings.textContent = bookings.filter(b => b.status === "Confirmed").length;
  completedBookings.textContent = bookings.filter(b => b.status === "Completed").length;
}

// 事件监听
bookingStatusFilter.addEventListener("change", loadBookings);
refreshBtn.addEventListener("click", loadBookings);

// 初始加载
loadBookings();
