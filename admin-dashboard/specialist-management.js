// ===============================
// Specialist Management - A2 Admin
// Backend API: http://localhost:8080/api/v1/specialists
// ===============================

let specialists = [];

const SPECIALIST_API_URL = "http://localhost:8080/api/v1/specialists";

// Table and form elements
const specialistTableBody = document.getElementById("specialistTableBody");
const specialistForm = document.getElementById("specialistForm");
const statusFilter = document.getElementById("specialistStatusFilter");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const showFormBtn = document.getElementById("showFormBtn");

const editIndex = document.getElementById("editIndex");

const nameInput = document.getElementById("name");
const expertiseInput = document.getElementById("expertise");
const levelInput = document.getElementById("level");
const feeInput = document.getElementById("fee");
const statusInput = document.getElementById("status");
const contactInput = document.getElementById("contact");
const descriptionInput = document.getElementById("description");

// Statistics elements
const totalSpecialists = document.getElementById("totalSpecialists");
const availableSpecialists = document.getElementById("availableSpecialists");
const unavailableSpecialists = document.getElementById("unavailableSpecialists");


// ===============================
// 1. Load specialists from backend
// ===============================

async function loadSpecialists() {
  try {
    const response = await fetch(SPECIALIST_API_URL);

    if (!response.ok) {
      throw new Error("Failed to load specialist data.");
    }

    specialists = await response.json();
    refreshView();
  } catch (error) {
    console.error(error);
    alert("Failed to load specialists from backend. Please check whether the backend is running on http://localhost:8080.");
  }
}


// ===============================
// 2. Render specialist table
// ===============================

function renderSpecialists(status = "All") {
  specialistTableBody.innerHTML = "";

  const filteredSpecialists =
    status === "All"
      ? specialists
      : specialists.filter((specialist) => specialist.statusText === status);

  filteredSpecialists.forEach((specialist) => {
    const realIndex = specialists.indexOf(specialist);
    const row = document.createElement("tr");

    const statusText = specialist.statusText || getStatusText(specialist.status);

    row.innerHTML = `
      <td>${specialist.name || ""}</td>
      <td>${specialist.expertise || ""}</td>
      <td>${specialist.level || ""}</td>
      <td>${specialist.fee || ""}</td>
      <td>
        <span class="badge ${statusText.toLowerCase()}">
          ${statusText}
        </span>
      </td>
      <td>${specialist.contact || ""}</td>
      <td class="description-cell">${specialist.description || ""}</td>
      <td>
        <button class="table-btn edit-btn" onclick="editSpecialist(${realIndex})">
          Edit
        </button>
        <button class="table-btn disable-btn" onclick="toggleSpecialistStatus(${realIndex})">
          ${Number(specialist.status) === 1 ? "Set Unavailable" : "Set Available"}
        </button>
      </td>
    `;

    specialistTableBody.appendChild(row);
  });
}


// ===============================
// 3. Update dashboard statistics
// ===============================

function updateStats() {
  if (totalSpecialists) {
    totalSpecialists.textContent = specialists.length;
  }

  if (availableSpecialists) {
    availableSpecialists.textContent = specialists.filter(
      (specialist) => Number(specialist.status) === 1
    ).length;
  }

  if (unavailableSpecialists) {
    unavailableSpecialists.textContent = specialists.filter(
      (specialist) => Number(specialist.status) === 0
    ).length;
  }
}


// ===============================
// 4. Helper: convert status number to text
// ===============================

function getStatusText(status) {
  return Number(status) === 1 ? "Available" : "Unavailable";
}


// ===============================
// 5. Clear form
// ===============================

function clearForm() {
  specialistForm.reset();
  editIndex.value = "";

  formTitle.textContent = "Add Specialist";
  submitBtn.textContent = "Save Specialist";
}


// ===============================
// 6. Get form data
// Important: Specialist status must be number 1 or 0
// ===============================

function getSpecialistFormData() {
  return {
    name: nameInput.value.trim(),
    expertise: expertiseInput.value.trim(),
    level: levelInput.value.trim(),
    fee: Number(feeInput.value),
    status: Number(statusInput.value),
    contact: contactInput.value.trim(),
    description: descriptionInput.value.trim()
  };
}


// ===============================
// 7. Add or update specialist
// POST: add specialist
// PUT: update specialist
// ===============================

specialistForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const specialistData = getSpecialistFormData();
  const currentEditIndex = editIndex.value;

  try {
    let response;

    if (currentEditIndex === "") {
      response = await fetch(SPECIALIST_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(specialistData)
      });

      if (!response.ok) {
        throw new Error("Failed to add specialist.");
      }

      alert("Specialist added successfully.");
    } else {
      const specialistId = specialists[currentEditIndex].id;

      response = await fetch(`${SPECIALIST_API_URL}/${specialistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(specialistData)
      });

      if (!response.ok) {
        throw new Error("Failed to update specialist.");
      }

      alert("Specialist updated successfully.");
    }

    clearForm();
    await loadSpecialists();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});


// ===============================
// 8. Edit specialist
// ===============================

function editSpecialist(index) {
  const specialist = specialists[index];

  editIndex.value = index;

  nameInput.value = specialist.name || "";
  expertiseInput.value = specialist.expertise || "";
  levelInput.value = specialist.level || "";
  feeInput.value = specialist.fee || "";
  statusInput.value = Number(specialist.status);
  contactInput.value = specialist.contact || "";
  descriptionInput.value = specialist.description || "";

  formTitle.textContent = "Edit Specialist";
  submitBtn.textContent = "Update Specialist";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ===============================
// 9. Toggle specialist status
// Important: B3 said PATCH body should directly send number 1 or 0
// ===============================

async function toggleSpecialistStatus(index) {
  const specialist = specialists[index];
  const newStatus = Number(specialist.status) === 1 ? 0 : 1;

  try {
    const response = await fetch(`${SPECIALIST_API_URL}/${specialist.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newStatus)
    });

    if (!response.ok) {
      throw new Error("Failed to update specialist status.");
    }

    await loadSpecialists();
  } catch (error) {
    console.error(error);
    alert("Failed to update specialist status.");
  }
}


// ===============================
// 10. Refresh table and statistics
// ===============================

function refreshView() {
  renderSpecialists(specialistStatusFilter.value);
  updateStats();
}


// ===============================
// 11. Event listeners
// ===============================

specialistStatusFilter.addEventListener("change", function () {
  refreshView();
});

resetBtn.addEventListener("click", clearForm);

showFormBtn.addEventListener("click", function () {
  clearForm();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});


// ===============================
// 12. Initial load
// ===============================

loadSpecialists();
