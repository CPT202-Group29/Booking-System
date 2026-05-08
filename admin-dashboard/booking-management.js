const API_BASE_URL = "http://121.196.221.244:8080/api/v1";

let bookings = [];
let currentPage = 0;
const pageSize = 10;
let currentStatusFilter = "All";

const bookingTableBody = document.getElementById("bookingTableBody");
const bookingStatusFilter = document.getElementById("bookingStatusFilter");
const refreshBtn = document.getElementById("refreshBtn");

const totalBookings = document.getElementById("totalBookings");
const pendingBookings = document.getElementById("pendingBookings");
const confirmedBookings = document.getElementById("confirmedBookings");
const completedBookings = document.getElementById("completedBookings");

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

async function loadBookings() {
  try {
    const selectedStatus = bookingStatusFilter.value;
    currentStatusFilter = selectedStatus;
    // 拉取所有预订，避免分页遗漏
    let url = `${API_BASE_URL}/bookings?size=999`;
    if (selectedStatus !== "All") {
      url += `&status=${toBackendStatus(selectedStatus)}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load bookings. Status: ${response.status}`);
    const data = await response.json();
    // 兼容分页格式：如果后端返回分页对象，提取 content 数组；否则直接使用原始数组
    const raw = Array.isArray(data.content) ? data.content : data;
    bookings = Array.isArray(raw) ? raw.map(mapBookingFromBackend) : [];
    currentPage = 0;
    renderBookings();
    updateStats();
    renderPagination();
  } catch (error) {
    console.error("Error loading bookings:", error);
    alert("Failed to load booking data.");
  }
}

function renderBookings() {
  bookingTableBody.innerHTML = "";
  const start = currentPage * pageSize;
  const pageItems = bookings.slice(start, start + pageSize);
  if (pageItems.length === 0) {
    bookingTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No booking records found.</td></tr>`;
    return;
  }
  pageItems.forEach((booking) => {
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

function renderActionButtons(booking) {
  const logsBtn = `<button class="table-btn logs-btn" onclick="viewLogs(${booking.id})">Logs</button>`;
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
  return logsBtn;
}

function renderPagination() {
  const container = document.getElementById("pagination");
  if (!container) return;
  const totalPages = Math.ceil(bookings.length / pageSize) || 1;
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = '';
  html += `<button ${currentPage === 0 ? 'disabled' : ''} data-page="${currentPage - 1}">← Prev</button>`;
  for (let i = 0; i < totalPages; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i + 1}</button>`;
  }
  html += `<button ${currentPage >= totalPages - 1 ? 'disabled' : ''} data-page="${currentPage + 1}">Next →</button>`;
  container.innerHTML = html;
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = parseInt(e.target.dataset.page);
      if (!isNaN(p)) {
        currentPage = p;
        renderBookings();
        renderPagination();
      }
    });
  });
}

function updateStats() {
  totalBookings.textContent = bookings.length;
  pendingBookings.textContent = bookings.filter(b => b.status === "Pending").length;
  confirmedBookings.textContent = bookings.filter(b => b.status === "Confirmed").length;
  completedBookings.textContent = bookings.filter(b => b.status === "Completed").length;
}

async function confirmBooking(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/confirm`, { method: "PUT" });
    if (!response.ok) throw new Error(`Confirm failed. Status: ${response.status}`);
    await loadBookings();
  } catch (error) {
    console.error("Error confirming booking:", error);
    alert("Failed to confirm booking.");
  }
}

async function completeBooking(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/complete`, { method: "PUT" });
    if (!response.ok) throw new Error(`Complete failed. Status: ${response.status}`);
    await loadBookings();
  } catch (error) {
    console.error("Error completing booking:", error);
    alert("Failed to complete booking.");
  }
}

async function cancelBooking(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/admin-cancel`, { method: "POST" });
    if (!response.ok) throw new Error(`Cancel failed. Status: ${response.status}`);
    await loadBookings();
  } catch (error) {
    console.error("Error cancelling booking:", error);
    alert("Failed to cancel booking.");
  }
}

// 日志查看函数需保持原有实现
async function viewLogs(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/logs`);
    if (!response.ok) throw new Error("Failed to load logs");
    const logs = await response.json();
    if (logs.length === 0) {
      alert('No status change logs for this booking.');
      return;
    }
    let logText = 'Status Change Logs:\n\n';
    logs.forEach(log => {
      logText += `[${new Date(log.changedAt).toLocaleString()}] ${log.previousStatus || 'N/A'} → ${log.newStatus} by ${log.changedBy || 'System'}\nReason: ${log.reason || 'N/A'}\n\n`;
    });
    alert(logText);
  } catch (error) {
    console.error("Error loading logs:", error);
    alert('Failed to load logs.');
  }
}

bookingStatusFilter.addEventListener("change", () => loadBookings());
refreshBtn.addEventListener("click", () => loadBookings());

loadBookings();
