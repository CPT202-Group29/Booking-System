// ===============================
// A2 Admin Dashboard
// Integrated with B1, B2, B3 APIs
// ===============================

// B3 APIs
const SPECIALIST_API_URL = "http://localhost:8080/api/v1/specialists";
const EXPERTISE_API_URL = "http://localhost:8080/api/v1/expertise";

// B2 API
const BOOKING_API_URL = "http://localhost:8080/api/v1/bookings";

// B1 API
const CUSTOMER_API_URL = "http://localhost:8080/api/customers";

let specialists = [];
let expertiseCategories = [];
let bookings = [];
let customers = [];

// ===============================
// Helper: safe DOM update
// ===============================

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

// ===============================
// 1. Load Specialist Data - B3
// ===============================

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
    renderSpecialistSummaryTable();
  } catch (error) {
    console.error("Specialist API Error:", error);
  }
}

function updateSpecialistStats() {
  const total = specialists.length;

  const available = specialists.filter(
    (specialist) => Number(specialist.status) === 1 || specialist.statusText === "Available"
  ).length;

  const unavailable = specialists.filter(
    (specialist) => Number(specialist.status) === 0 || specialist.statusText === "Unavailable"
  ).length;

  setText("totalSpecialists", total);
  setText("availableSpecialists", available);
  setText("unavailableSpecialists", unavailable);
}

function renderSpecialistSummaryTable() {
  const tableBody = document.getElementById("specialistSummaryTableBody");

  if (!tableBody) return;

  tableBody.innerHTML = "";

  specialists.slice(0, 5).forEach((specialist) => {
    const statusText =
      specialist.statusText ||
      (Number(specialist.status) === 1 ? "Available" : "Unavailable");

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${specialist.name || ""}</td>
      <td>${specialist.expertise || ""}</td>
      <td>${specialist.level || ""}</td>
      <td>${statusText}</td>
    `;

    tableBody.appendChild(row);
  });
}

// ===============================
// 2. Load Expertise Data - B3
// ===============================

async function loadExpertise() {
  try {
    const response = await fetch(EXPERTISE_API_URL, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error("Failed to load expertise.");
    }

    expertiseCategories = await response.json();
    updateExpertiseStats();
    renderExpertiseSummaryTable();
  } catch (error) {
    console.error("Expertise API Error:", error);
  }
}

function updateExpertiseStats() {
  const total = expertiseCategories.length;

  const active = expertiseCategories.filter(
    (category) => category.status === "Active"
  ).length;

  const inactive = expertiseCategories.filter(
    (category) => category.status === "Inactive"
  ).length;

  setText("totalExpertise", total);
  setText("activeExpertise", active);
  setText("inactiveExpertise", inactive);
}

function renderExpertiseSummaryTable() {
  const tableBody = document.getElementById("expertiseSummaryTableBody");

  if (!tableBody) return;

  tableBody.innerHTML = "";

  expertiseCategories.slice(0, 5).forEach((category) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${category.expertiseName || ""}</td>
      <td>${category.status || ""}</td>
      <td>${category.usedBy ?? ""}</td>
    `;

    tableBody.appendChild(row);
  });
}

// ===============================
// 3. Load Booking Data - B2
// ===============================

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
    renderBookingSummaryTable();
  } catch (error) {
    console.error("Booking API Error:", error);
  }
}

function updateBookingStats() {
  const total = bookings.length;

  const pending = bookings.filter(
    (booking) => booking.status === "PENDING"
  ).length;

  const confirmed = bookings.filter(
    (booking) => booking.status === "CONFIRMED"
  ).length;

  const completed = bookings.filter(
    (booking) => booking.status === "COMPLETED"
  ).length;

  const cancelled = bookings.filter(
    (booking) =>
      booking.status === "CANCELLED" ||
      booking.status === "CANCELED"
  ).length;

  setText("totalBookings", total);
  setText("pendingBookings", pending);
  setText("confirmedBookings", confirmed);
  setText("completedBookings", completed);
  setText("cancelledBookings", cancelled);
}

function renderBookingSummaryTable() {
  const tableBody = document.getElementById("bookingSummaryTableBody");

  if (!tableBody) return;

  tableBody.innerHTML = "";

  bookings.slice(0, 5).forEach((booking) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${booking.id || ""}</td>
      <td>${booking.customerId || booking.customerName || ""}</td>
      <td>${booking.specialistId || booking.specialistName || ""}</td>
      <td>${booking.status || ""}</td>
    `;

    tableBody.appendChild(row);
  });
}

// ===============================
// 4. Load Customer Data - B1
// ===============================

async function loadCustomers() {
  try {
    const response = await fetch(CUSTOMER_API_URL, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error("Failed to load customers.");
    }

    customers = await response.json();
    updateCustomerStats();
    renderCustomerSummaryTable();
  } catch (error) {
    console.error("Customer API Error:", error);
  }
}

function updateCustomerStats() {
  const total = customers.length;

  setText("totalCustomers", total);
}

function renderCustomerSummaryTable() {
  const tableBody = document.getElementById("customerSummaryTableBody");

  if (!tableBody) return;

  tableBody.innerHTML = "";

  customers.slice(0, 5).forEach((customer) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${customer.id || ""}</td>
      <td>${customer.name || ""}</td>
      <td>${customer.phone || ""}</td>
      <td>${customer.gender || ""}</td>
      <td>${customer.age || ""}</td>
      <td>${customer.address || ""}</td>
    `;

    tableBody.appendChild(row);
  });
}

// ===============================
// 5. Load all dashboard data
// ===============================

async function loadDashboardData() {
  await Promise.all([
    loadSpecialists(),
    loadExpertise(),
    loadBookings(),
    loadCustomers()
  ]);
}

// ===============================
// 6. Refresh button if exists
// ===============================

const refreshDashboardBtn = document.getElementById("refreshDashboardBtn");

if (refreshDashboardBtn) {
  refreshDashboardBtn.addEventListener("click", function () {
    loadDashboardData();
  });
}

// ===============================
// 7. Initial load
// ===============================

loadDashboardData();
