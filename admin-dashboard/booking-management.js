let bookings = [];

const API_BASE = "http://localhost:8080";

const bookingTableBody = document.getElementById("bookingTableBody");
const bookingStatusFilter = document.getElementById("bookingStatusFilter");
const refreshBtn = document.getElementById("refreshBtn");

const totalBookings = document.getElementById("totalBookings");
const pendingBookings = document.getElementById("pendingBookings");
const confirmedBookings = document.getElementById("confirmedBookings");
const completedBookings = document.getElementById("completedBookings");

function formatStatus(status) {
  if (!status) return "-";

  const upper = String(status).toUpperCase();

  if (upper === "PENDING") return "Pending";
  if (upper === "CONFIRMED") return "Confirmed";
  if (upper === "COMPLETED") return "Completed";
  if (upper === "CANCELLED" || upper === "CANCELED") return "Cancelled";

  return status;
}

function getApiStatus(status) {
  if (!status || status === "All") return "ALL";

  return String(status).toUpperCase();
}

function getStatusClass(status) {
  if (!status) return "";

  return String(status).toLowerCase();
}

function mapBooking(item) {
  return {
    id: item.id,
    customer: item.customerName || item.customer || item.customerId || "-",
    specialist: item.specialistName || item.specialist || item.specialistId || "-",
    topic: item.topic || "-",
    date: item.date || "-",
    time: item.time || "-",
    fee: item.chargeAmount || item.fee || 0,
    status: formatStatus(item.status)
  };
}

async function loadBookings(status = "All") {
  try {
    bookingTableBody.innerHTML = `
      <tr>
        <td colspan="9">Loading booking data...</td>
      </tr>
    `;

    let url = `${API_BASE}/api/v1/bookings`;
    const apiStatus = getApiStatus(status);

    if (apiStatus !== "ALL") {
      url += `?status=${apiStatus}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }

    const data = await response.json();

    bookings = data.map(mapBooking);

    renderBookings(status);
    updateStats();
  } catch (error) {
    console.error(error);

    bookingTableBody.innerHTML = `
      <tr>
        <td colspan="9">
          Failed to load booking data. Please check whether the backend is running.
        </td>
      </tr>
    `;

    bookings = [];
    updateStats();
  }
}

function renderBookings(status = "All") {
  bookingTableBody.innerHTML = "";

  const filteredBookings =
    status === "All"
      ? bookings
      : bookings.filter((booking) => booking.status === status);

  if (filteredBookings.length === 0) {
    bookingTableBody.innerHTML = `
      <tr>
        <td colspan="9">No booking records found.</td>
      </tr>
    `;
    return;
  }

  filteredBookings.forEach((booking) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${booking.id}</td>
      <td>${booking.customer}</td>
      <td>${booking.specialist}</td>
      <td>${booking.topic}</td>
      <td>${booking.date}</td>
      <td>${booking.time}</td>
      <td>£${booking.fee}</td>
      <td>
        <span class="badge ${getStatusClass(booking.status)}">
          ${booking.status}
        </span>
      </td>
      <td>${renderActionButtons(booking)}</td>
    `;

    bookingTableBody.appendChild(row);
  });
}

function renderActionButtons(booking) {
  if (booking.status === "Pending") {
    return `
      <button class="table-btn confirm-btn" onclick="confirmBooking('${booking.id}')">Confirm</button>
      <button class="table-btn cancel-btn" onclick="cancelBooking('${booking.id}')">Cancel</button>
    `;
  }

  if (booking.status === "Confirmed") {
    return `
      <button class="table-btn complete-btn" onclick="completeBooking('${booking.id}')">Complete</button>
      <button class="table-btn cancel-btn" onclick="cancelBooking('${booking.id}')">Cancel</button>
    `;
  }

  if (booking.status === "Completed") {
    return `<span class="locked-label">Locked</span>`;
  }

  if (booking.status === "Cancelled") {
    return `<span class="locked-label">Cancelled</span>`;
  }

  return "";
}

async function confirmBooking(id) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/bookings/${id}/confirm`, {
      method: "PUT"
    });

    if (!response.ok) {
      throw new Error("Failed to confirm booking");
    }

    await loadBookings(bookingStatusFilter.value);
  } catch (error) {
    console.error(error);
    alert("Failed to confirm booking. Please check the backend.");
  }
}

async function cancelBooking(id) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/bookings/${id}/admin-cancel`, {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("Failed to cancel booking");
    }

    await loadBookings(bookingStatusFilter.value);
  } catch (error) {
    console.error(error);
    alert("Failed to cancel booking. Please check the backend.");
  }
}

async function completeBooking(id) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/bookings/${id}/complete`, {
      method: "PUT"
    });

    if (!response.ok) {
      throw new Error("Failed to complete booking");
    }

    await loadBookings(bookingStatusFilter.value);
  } catch (error) {
    console.error(error);
    alert("Failed to complete booking. Please check the backend.");
  }
}

function updateStats() {
  totalBookings.textContent = bookings.length;

  pendingBookings.textContent = bookings.filter(
    (booking) => booking.status === "Pending"
  ).length;

  confirmedBookings.textContent = bookings.filter(
    (booking) => booking.status === "Confirmed"
  ).length;

  completedBookings.textContent = bookings.filter(
    (booking) => booking.status === "Completed"
  ).length;
}

bookingStatusFilter.addEventListener("change", function () {
  loadBookings(bookingStatusFilter.value);
});

refreshBtn.addEventListener("click", function () {
  loadBookings(bookingStatusFilter.value);
});

loadBookings();
