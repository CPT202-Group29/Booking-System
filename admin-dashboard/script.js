const specialists = [
  {
    name: "Dr. Wang",
    expertise: "Academic Support",
    level: "Senior",
    fee: 200,
    status: "Available",
    contact: "wang@example.com",
    description: "Provides academic consultation and study planning support."
  },
  {
    name: "Prof. Zhang",
    expertise: "Career Advice",
    level: "Expert",
    fee: 250,
    status: "Available",
    contact: "zhang@example.com",
    description: "Specialises in career planning, CV guidance, and interview preparation."
  },
  {
    name: "Dr. Smith",
    expertise: "Mental Health Support",
    level: "Senior",
    fee: 220,
    status: "Unavailable",
    contact: "smith@example.com",
    description: "Provides consultation on stress management and personal wellbeing."
  },
  {
    name: "Dr. Lee",
    expertise: "Technical Consulting",
    level: "Junior",
    fee: 150,
    status: "Available",
    contact: "lee@example.com",
    description: "Supports students with technical project planning and software development advice."
  }
];

const recentBookings = [
  {
    id: "B001",
    customer: "Alice Chen",
    specialist: "Dr. Wang",
    date: "2026-05-01",
    time: "10:00",
    status: "Pending"
  },
  {
    id: "B002",
    customer: "Bob Li",
    specialist: "Prof. Zhang",
    date: "2026-05-02",
    time: "14:00",
    status: "Confirmed"
  },
  {
    id: "B003",
    customer: "Cindy Liu",
    specialist: "Dr. Smith",
    date: "2026-05-03",
    time: "16:00",
    status: "Completed"
  },
  {
    id: "B004",
    customer: "David Zhao",
    specialist: "Dr. Lee",
    date: "2026-05-04",
    time: "09:30",
    status: "Cancelled"
  }
];

const specialistTableBody = document.getElementById("specialistTableBody");
const bookingTableBody = document.getElementById("bookingTableBody");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");

const totalSpecialists = document.getElementById("totalSpecialists");
const availableSpecialists = document.getElementById("availableSpecialists");

function renderSpecialists(status = "All") {
  specialistTableBody.innerHTML = "";

  const filteredSpecialists =
    status === "All"
      ? specialists
      : specialists.filter((specialist) => specialist.status === status);

  filteredSpecialists.forEach((specialist) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${specialist.name}</td>
      <td>${specialist.expertise}</td>
      <td>${specialist.level}</td>
      <td>£${specialist.fee}</td>
      <td>
        <span class="badge ${specialist.status.toLowerCase()}">
          ${specialist.status}
        </span>
      </td>
      <td>${specialist.contact}</td>
      <td class="description-cell">${specialist.description}</td>
    `;

    specialistTableBody.appendChild(row);
  });
}

function renderBookings() {
  bookingTableBody.innerHTML = "";

  recentBookings.forEach((booking) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${booking.id}</td>
      <td>${booking.customer}</td>
      <td>${booking.specialist}</td>
      <td>${booking.date}</td>
      <td>${booking.time}</td>
      <td>
        <span class="badge ${booking.status.toLowerCase()}">
          ${booking.status}
        </span>
      </td>
    `;

    bookingTableBody.appendChild(row);
  });
}

function updateStats() {
  totalSpecialists.textContent = specialists.length;

  const availableCount = specialists.filter(
    (specialist) => specialist.status === "Available"
  ).length;

  availableSpecialists.textContent = availableCount;
}

statusFilter.addEventListener("change", function () {
  renderSpecialists(this.value);
});

refreshBtn.addEventListener("click", function () {
  renderSpecialists(statusFilter.value);
  renderBookings();
  updateStats();
  alert("Dashboard data refreshed.");
});

renderSpecialists();
renderBookings();
updateStats();
