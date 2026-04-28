let bookings = [
  {
    id: "B001",
    customer: "Alice Chen",
    specialist: "Dr. Wang",
    topic: "Academic planning",
    date: "2026-05-01",
    time: "10:00",
    fee: 200,
    status: "Pending"
  },
  {
    id: "B002",
    customer: "Bob Li",
    specialist: "Prof. Zhang",
    topic: "Career advice",
    date: "2026-05-02",
    time: "14:00",
    fee: 250,
    status: "Confirmed"
  },
  {
    id: "B003",
    customer: "Cindy Liu",
    specialist: "Dr. Smith",
    topic: "Stress management",
    date: "2026-05-03",
    time: "16:00",
    fee: 220,
    status: "Completed"
  },
  {
    id: "B004",
    customer: "David Zhao",
    specialist: "Dr. Lee",
    topic: "Software project support",
    date: "2026-05-04",
    time: "09:30",
    fee: 150,
    status: "Cancelled"
  },
  {
    id: "B005",
    customer: "Emma Sun",
    specialist: "Dr. Wang",
    topic: "Study plan review",
    date: "2026-05-05",
    time: "11:00",
    fee: 200,
    status: "Pending"
  }
];

const bookingTableBody = document.getElementById("bookingTableBody");
const bookingStatusFilter = document.getElementById("bookingStatusFilter");
const refreshBtn = document.getElementById("refreshBtn");

const totalBookings = document.getElementById("totalBookings");
const pendingBookings = document.getElementById("pendingBookings");
const confirmedBookings = document.getElementById("confirmedBookings");
const completedBookings = document.getElementById("completedBookings");

function getStatusClass(status) {
  return status.toLowerCase();
}

function renderBookings(status = "All") {
  bookingTableBody.innerHTML = "";

  const filteredBookings =
    status === "All"
      ? bookings
      : bookings.filter((booking) => booking.status === status);

  filteredBookings.forEach((booking) => {
    const realIndex = bookings.indexOf(booking);
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
      <td>${renderActionButtons(booking, realIndex)}</td>
    `;

    bookingTableBody.appendChild(row);
  });
}

function renderActionButtons(booking, index) {
  if (booking.status === "Pending") {
    return `
      <button class="table-btn confirm-btn" onclick="confirmBooking(${index})">Confirm</button>
      <button class="table-btn cancel-btn" onclick="cancelBooking(${index})">Cancel</button>
    `;
  }

  if (booking.status === "Confirmed") {
    return `
      <button class="table-btn complete-btn" onclick="completeBooking(${index})">Complete</button>
      <button class="table-btn cancel-btn" onclick="cancelBooking(${index})">Cancel</button>
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

function confirmBooking(index) {
  bookings[index].status = "Confirmed";
  refreshView();
}

function cancelBooking(index) {
  bookings[index].status = "Cancelled";
  refreshView();
}

function completeBooking(index) {
  bookings[index].status = "Completed";
  refreshView();
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

function refreshView() {
  renderBookings(bookingStatusFilter.value);
  updateStats();
}

bookingStatusFilter.addEventListener("change", function () {
  refreshView();
});

refreshBtn.addEventListener("click", function () {
  refreshView();
  alert("Booking data refreshed.");
});

refreshView();
