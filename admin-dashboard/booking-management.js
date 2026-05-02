const API_BASE_URL = "http://localhost:8080/api/v1";

let bookings = [];

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

    let url = `${API_BASE_URL}/bookings`;

    if (selectedStatus !== "All") {
      url += `?status=${toBackendStatus(selectedStatus)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load bookings. Status: ${response.status}`);
    }

    const data = await response.json();

    bookings = Array.isArray(data)
      ? data.map(mapBookingFromBackend)
      : [];

    renderBookings();
    updateStats();
  } catch (error) {
    console.error("Error loading bookings:", error);
    alert("Failed to load booking data. Please check whether the backend is running.");
  }
}

function renderBookings() {
  bookingTableBody.innerHTML = "";

  if (bookings.length === 0) {
    bookingTableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: #6b7280;">
          No booking records found.
        </td>
      </tr>
    `;
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
      <button class="table-btn confirm-btn" onclick="confirmBooking(${booking.id})">Confirm</button>
      <button class="table-btn cancel-btn" onclick="cancelBooking(${booking.id})">Cancel</button>
    `;
  }

  if (booking.status === "Confirmed") {
    return `
      <button class="table-btn complete-btn" onclick="completeBooking(${booking.id})">Complete</button>
      <button class="table-btn cancel-btn" onclick="cancelBooking(${booking.id})">Cancel</button>
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
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/confirm`, {
      method: "PUT"
    });

    if (!response.ok) {
      throw new Error(`Confirm failed. Status: ${response.status}`);
    }

    await loadBookings();
  } catch (error) {
    console.error("Error confirming booking:", error);
    alert("Failed to confirm booking.");
  }
}

async function completeBooking(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/complete`, {
      method: "PUT"
    });

    if (!response.ok) {
      throw new Error(`Complete failed. Status: ${response.status}`);
    }

    await loadBookings();
  } catch (error) {
    console.error("Error completing booking:", error);
    alert("Failed to complete booking.");
  }
}

async function cancelBooking(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/admin-cancel`, {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(`Cancel failed. Status: ${response.status}`);
    }

    await loadBookings();
  } catch (error) {
    console.error("Error cancelling booking:", error);
    alert("Failed to cancel booking.");
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
  loadBookings();
});

refreshBtn.addEventListener("click", function () {
  loadBookings();
});

loadBookings();
