// ===============================
// Specialist Management - A2 Admin
// Backend API: /api/v1/specialists
// ===============================

let specialists = [];

const SPECIALIST_API_URL = "/api/v1/specialists";

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
  return { "Content-Type": "application/json" };
}

function getStatusText(status) {
  if (status === "Available" || status === "Unavailable") return status;
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

function validateSpecialistForm(data) {
  const errors = [];
  if (!data.name) {
    errors.push("Name cannot be empty.");
  }
  if (!data.expertise) {
    errors.push("Expertise cannot be empty.");
  }
  if (!data.level) {
    errors.push("Level is required.");
  }
  if (isNaN(data.fee) || data.fee < 0) {
    errors.push("Fee must be a valid number (>= 0).");
  }
  if (!data.contact) {
    errors.push("Contact cannot be empty.");
  }
  if (!data.description) {
    errors.push("Description cannot be empty.");
  }
  return errors;
}

function getSpecialistFormData() {
  const feeRaw = feeInput.value.trim();
  const feeValue = (feeRaw === "") ? NaN : Number(feeRaw);
  return {
    name: nameInput.value.trim(),
    expertise: expertiseInput.value.trim(),
    level: levelInput.value.trim(),
    fee: feeValue,
    status: Number(statusInput.value),
    contact: contactInput.value.trim(),
    description: descriptionInput.value.trim()
  };
}

/** 加载专家列表，兼容分页格式，拉取全部数据（用于管理） */
async function loadSpecialists() {
  try {
    // 使用 size=999 确保管理端获取全部专家，无需分页
    const response = await fetch(`${SPECIALIST_API_URL}?size=999`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error("Failed to load specialist data.");
    }

    const data = await response.json();
    // 兼容分页格式：如果返回的是分页对象，提取 content 数组；否则直接使用
    if (data && Array.isArray(data.content)) {
      specialists = data.content;
    } else if (Array.isArray(data)) {
      specialists = data;
    } else {
      throw new Error("Unexpected response format");
    }
    refreshView();
  } catch (error) {
    console.error("Specialist API Error:", error);
    alert("Failed to load specialists from backend. Please check whether the backend is running on .");
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
    specialistTableBody.innerHTML = `<tr><td colspan="8">No specialist records found.</td></tr>`;
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
      <td><span class="badge ${statusText.toLowerCase()}">${statusText}</span></td>
      <td>${specialist.contact || ""}</td>
      <td class="description-cell">${specialist.description || ""}</td>
      <td>
        <button class="table-btn edit-btn" onclick="editSpecialist(${realIndex})">Edit</button>
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

  const validationErrors = validateSpecialistForm(specialistData);
  if (validationErrors.length > 0) {
    alert("Please fix the following errors:\n- " + validationErrors.join("\n- "));
    return;
  }

  try {
    let response;
    if (currentEditIndex === "") {
      response = await fetch(SPECIALIST_API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(specialistData)
      });
      if (!response.ok) throw new Error("Failed to add specialist.");
      alert("Specialist added successfully.");
    } else {
      const specialistId = getSpecialistId(specialists[currentEditIndex]);
      response = await fetch(`${SPECIALIST_API_URL}/${specialistId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(specialistData)
      });
      if (!response.ok) throw new Error("Failed to update specialist.");
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
  window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (!response.ok) throw new Error("Failed to update specialist status.");
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
  window.scrollTo({ top: 0, behavior: "smooth" });
});

loadSpecialists();

// ========== Pending Applications ==========
async function loadPendingSpecialists() {
    try {
        const resp = await fetch('/api/admin/specialists/pending');
        const data = await resp.json();
        const tbody = document.getElementById('pendingTableBody');
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No pending applications</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(s => 
            '<tr>' +
            '<td>' + s.id + '</td>' +
            '<td>' + (s.name || '-') + '</td>' +
            '<td>' + (s.expertise || '-') + '</td>' +
            '<td><span class="badge pending">PENDING</span></td>' +
            '<td>' +
            '<button class="table-btn confirm-btn" onclick="approveSpecialist(' + s.id + ')">Approve</button> ' +
            '<button class="table-btn cancel-btn" onclick="rejectSpecialist(' + s.id + ')">Reject</button>' +
            '</td>' +
            '</tr>'
        ).join('');
    } catch (e) {
        console.error('Failed to load pending specialists', e);
    }
}

async function approveSpecialist(id) {
    const level = prompt('Assign level:\n1. Junior\n2. Intermediate\n3. Senior\n\nEnter level name:', 'Junior');
    if (!level) return;
    const fee = prompt('Assign fee:\n1. 50\n2. 90\n3. 120\n\nEnter fee amount:', '50');
    if (!fee || !['50','90','120'].includes(fee)) {
        alert('Fee must be 50, 90, or 120');
        return;
    }
    try {
        await fetch('/api/admin/specialists/' + id + '/approve', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({level: level, fee: parseFloat(fee)})
        });
        alert('Specialist approved!');
        loadPendingSpecialists();
    } catch (e) {
        alert('Failed to approve');
    }
}

async function rejectSpecialist(id) {
    if (!confirm('Reject this application?')) return;
    try {
        await fetch('/api/admin/specialists/' + id + '/reject', {method: 'PUT'});
        alert('Specialist rejected');
        loadPendingSpecialists();
    } catch (e) {
        alert('Failed to reject');
    }
}

loadPendingSpecialists();
