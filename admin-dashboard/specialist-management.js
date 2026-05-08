// ===============================
// Specialist Management - A2 Admin
// Backend API: http://121.196.221.244:8080/api/v1/specialists
// ===============================

let specialists = [];

const SPECIALIST_API_URL = "http://121.196.221.244:8080/api/v1/specialists";

const specialistTableBody = document.getElementById("specialistTableBody");
const specialistForm = document.getElementById("specialistForm");
const specialistStatusFilter = document.getElementById("statusFilter");

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

const totalSpecialists = document.getElementById("totalSpecialists");
const availableSpecialists = document.getElementById("availableSpecialists");
const unavailableSpecialists = document.getElementById("unavailableSpecialists");

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

function getStatusNumber(status) {
  if (status === "Available") return 1;
  if (status === "Unavailable") return 0;
  return Number(status) === 1 ? 1 : 0;
}

function getSpecialistId(specialist) {
  return specialist.id || specialist.specialistId;
}

function clearForm() {
  specialistForm.reset();
  editIndex.value = "";
  statusInput.value = "1";

  formTitle.textContent = "Add Specialist";
  submitBtn.textContent = "Save Specialist";
}

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

async function loadSpecialists() {
  try {
    const response = await fetch(SPECIALIST_API_URL, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error("Failed to load specialist data.");
    }

    specialists = await response.json();
    refreshView();
  } catch (error) {
    console.error("Specialist API Error:", error);
    alert("Failed to load specialists from backend. Please check whether the backend is running on http://121.196.221.244:8080.");
  }
}

function renderSpecialists(status = "All") {
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
        <td colspan="8">No specialist records found.</td>
      </tr>
    `;
    return;
  }

  filteredSpecialists.forEach((specialist) => {
    const realIndex = specialists.indexOf(specialist);
    const statusText = specialist.statusText || getStatusText(specialist.status);
    const statusNumber = getStatusNumber(specialist.status);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${specialist.name || ""}</td>
      <td>${specialist.expertise || ""}</td>
      <td>${specialist.level || ""}</td>
      <td>${specialist.fee ?? ""}</td>
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
          ${statusNumber === 1 ? "Set Unavailable" : "Set Available"}
        </button>
      </td>
    `;

    specialistTableBody.appendChild(row);
  });
}

function updateStats() {
  totalSpecialists.textContent = specialists.length;

  availableSpecialists.textContent = specialists.filter((specialist) => {
    const statusText = specialist.statusText || getStatusText(specialist.status);
    return statusText === "Available";
  }).length;

  unavailableSpecialists.textContent = specialists.filter((specialist) => {
    const statusText = specialist.statusText || getStatusText(specialist.status);
    return statusText === "Unavailable";
  }).length;
}

function refreshView() {
  renderSpecialists(specialistStatusFilter.value);
  updateStats();
}

specialistForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const specialistData = getSpecialistFormData();
  const currentEditIndex = editIndex.value;

  try {
    let response;

    if (currentEditIndex === "") {
      response = await fetch(SPECIALIST_API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(specialistData)
      });

      if (!response.ok) {
        throw new Error("Failed to add specialist.");
      }

      alert("Specialist added successfully.");
    } else {
      const specialistId = getSpecialistId(specialists[currentEditIndex]);

      response = await fetch(`${SPECIALIST_API_URL}/${specialistId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
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
    console.error("Save Specialist Error:", error);
    alert(error.message);
  }
});

function editSpecialist(index) {
  const specialist = specialists[index];

  editIndex.value = index;

  nameInput.value = specialist.name || "";
  expertiseInput.value = specialist.expertise || "";
  levelInput.value = specialist.level || "";
  feeInput.value = specialist.fee ?? "";
  statusInput.value = String(getStatusNumber(specialist.status));
  contactInput.value = specialist.contact || "";
  descriptionInput.value = specialist.description || "";

  formTitle.textContent = "Edit Specialist";
  submitBtn.textContent = "Update Specialist";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function toggleSpecialistStatus(index) {
  const specialist = specialists[index];
  const specialistId = getSpecialistId(specialist);
  const currentStatus = getStatusNumber(specialist.status);
  const newStatus = currentStatus === 1 ? 0 : 1;

  try {
    const response = await fetch(`${SPECIALIST_API_URL}/${specialistId}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(newStatus)
    });

    if (!response.ok) {
      throw new Error("Failed to update specialist status.");
    }

    await loadSpecialists();
  } catch (error) {
    console.error("Update Specialist Status Error:", error);
    alert("Failed to update specialist status.");
  }
}

specialistStatusFilter.addEventListener("change", refreshView);
resetBtn.addEventListener("click", clearForm);

showFormBtn.addEventListener("click", function () {
  clearForm();
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

loadSpecialists();
