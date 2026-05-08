// ===============================
// A2 Admin Dashboard
// Integrated with B2 booking API and B3 specialist API
// ===============================

const SPECIALIST_API_URL = "http://localhost:8080/api/v1/specialists";
const BOOKING_API_URL = "http://localhost:8080/api/v1/bookings";

let specialists = [];
let bookings = [];

const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");
const specialistTableBody = document.getElementById("specialistTableBody");
const bookingTableBody = document.getElementById("bookingTableBody");

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  if (token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }

  return {
    "Content-Type": "application/json"
  };
}

function getStatusText(status) {
  if (status === "Available" || status === "Unavailable") {
    return status;
  }

  return Number(status) === 1 ? "Available" : "Unavailable";
}

function normalizeBookingStatus(status) {
  return String(status || "").toUpperCase();
}

function getBookingDate(booking) {
  return booking.date || booking.bookingDate || booking.appointmentDate || booking.startDate || "";
}

function getBookingTime(booking) {
  return booking.time || booking.bookingTime || booking.appointmentTime || booking.startTime || "";
}

async function loadSpecialists() {
  try {
    const response = await fetch(SPECIALIST_API_URL, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error("Failed to load specialists.");
    }

    specialists = await response.json();
    updateSpecialistStats();
    renderSpecialistTable(statusFilter.value);
  } catch (error) {
    console.error("Specialist API Error:", error);
    specialistTableBody.innerHTML = `
      <tr>
        <td colspan="7">Failed to load specialist data. Please check the backend.</td>
      </tr>
    `;
  }
}

function updateSpecialistStats() {
  const total = specialists.length;

  const available = specialists.filter((specialist) => {
    const statusText = specialist.statusText || getStatusText(specialist.status);
    return statusText === "Available";
  }).length;

  setText("totalSpecialists", total);
  setText("availableSpecialists", available);
}

function renderSpecialistTable(status = "All") {
  specialistTableBody.innerHTML = "";

  const filteredSpecialists =
    status === "All"
      ? specialists
      : specialists.filter((specialist) => {
          const statusText = specialist.statusText || getStatusText(specialist.status);
          return statusText === status;
        });

  if (filteredSpecialists.length === 0) {
    specialistTableBody.innerHTML = `
      <tr>
        <td colspan="7">No specialist records found.</td>
      </tr>
    `;
    return;
  }

  filteredSpecialists.slice(0, 6).forEach((specialist) => {
    const statusText = specialist.statusText || getStatusText(specialist.status);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${specialist.name || ""}</td>
      <td>${specialist.expertise || ""}</td>
      <td>${specialist.level || ""}</td>
      <td>${specialist.fee ?? ""}</td>
      <td><span class="badge ${statusText.toLowerCase()}">${statusText}</span></td>
      <td>${specialist.contact || ""}</td>
      <td class="description-cell">${specialist.description || ""}</td>
    `;

    specialistTableBody.appendChild(row);
  });
}

async function loadBookings() {
  try {
    const response = await fetch(BOOKING_API_URL, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error("Failed to load bookings.");
    }

    bookings = await response.json();
    updateBookingStats();
    renderBookingTable();
  } catch (error) {
    console.error("Booking API Error:", error);
    bookingTableBody.innerHTML = `
      <tr>
        <td colspan="6">Failed to load booking data. Please check the backend.</td>
      </tr>
    `;
  }
}

function updateBookingStats() {
  const total = bookings.length;

  const pending = bookings.filter(
    (booking) => normalizeBookingStatus(booking.status) === "PENDING"
  ).length;

  const confirmed = bookings.filter(
    (booking) => normalizeBookingStatus(booking.status) === "CONFIRMED"
  ).length;

  const completed = bookings.filter(
    (booking) => normalizeBookingStatus(booking.status) === "COMPLETED"
  ).length;

  const cancelled = bookings.filter((booking) => {
    const status = normalizeBookingStatus(booking.status);
    return status === "CANCELLED" || status === "CANCELED";
  }).length;

  setText("totalBookings", total);
  setText("pendingBookings", pending);
  setText("summaryPendingBookings", pending);
  setText("summaryConfirmedBookings", confirmed);
  setText("summaryCompletedBookings", completed);
  setText("summaryCancelledBookings", cancelled);
}

function renderBookingTable() {
  bookingTableBody.innerHTML = "";

  if (bookings.length === 0) {
    bookingTableBody.innerHTML = `
      <tr>
        <td colspan="6">No booking records found.</td>
      </tr>
    `;
    return;
  }

  bookings.slice(0, 6).forEach((booking) => {
    const status = normalizeBookingStatus(booking.status);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${booking.id || booking.bookingId || ""}</td>
      <td>${booking.customerName || booking.customerId || ""}</td>
      <td>${booking.specialistName || booking.specialistId || ""}</td>
      <td>${getBookingDate(booking)}</td>
      <td>${getBookingTime(booking)}</td>
      <td>${status}</td>
    `;

    bookingTableBody.appendChild(row);
  });
}

async function loadDashboardData() {
  await Promise.all([
    loadSpecialists(),
    loadBookings()
  ]);
}

statusFilter.addEventListener("change", function () {
  renderSpecialistTable(statusFilter.value);
});

refreshBtn.addEventListener("click", function () {
  loadDashboardData();
});

loadDashboardData();
