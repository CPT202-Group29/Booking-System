let expertiseCategories = [];

const API_BASE_URL = "http://121.196.221.244:8080/api/v1/expertise";

const expertiseTableBody = document.getElementById("expertiseTableBody");
const expertiseForm = document.getElementById("expertiseForm");
const expertiseStatusFilter = document.getElementById("expertiseStatusFilter");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const showFormBtn = document.getElementById("showFormBtn");

const editIndex = document.getElementById("editIndex");
const expertiseNameInput = document.getElementById("expertiseName");
const statusInput = document.getElementById("status");
const usedByInput = document.getElementById("usedBy");
const descriptionInput = document.getElementById("description");

const totalExpertise = document.getElementById("totalExpertise");
const activeExpertise = document.getElementById("activeExpertise");
const inactiveExpertise = document.getElementById("inactiveExpertise");
const usedCategories = document.getElementById("usedCategories");

// 认证头
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

async function loadExpertise() {
  try {
    // 拉取全部数据，附带认证头
    const response = await fetch(`${API_BASE_URL}?size=999`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error("Failed to load expertise data.");
    }

    const data = await response.json();
    // 兼容分页格式
    if (data && Array.isArray(data.content)) {
      expertiseCategories = data.content;
    } else if (Array.isArray(data)) {
      expertiseCategories = data;
    } else {
      expertiseCategories = [];
    }
    refreshView();
  } catch (error) {
    console.error(error);
    alert("Failed to load expertise data from backend.");
  }
}

function renderExpertise(status = "All") {
  expertiseTableBody.innerHTML = "";

  const filteredCategories =
    status === "All"
      ? expertiseCategories
      : expertiseCategories.filter((category) => category.status === status);

  filteredCategories.forEach((category) => {
    const realIndex = expertiseCategories.indexOf(category);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${category.expertiseName}</td>
      <td class="description-cell">${category.description}</td>
      <td>
        <span class="badge ${category.status.toLowerCase()}">
          ${category.status}
        </span>
      </td>
      <td>${category.usedBy}</td>
      <td>
        <button class="table-btn edit-btn" onclick="editExpertise(${realIndex})">Edit</button>
        <button class="table-btn disable-btn" onclick="toggleExpertiseStatus(${realIndex})">
          ${category.status === "Active" ? "Set Inactive" : "Set Active"}
        </button>
      </td>
    `;

    expertiseTableBody.appendChild(row);
  });
}

function updateStats() {
  totalExpertise.textContent = expertiseCategories.length;
  activeExpertise.textContent = expertiseCategories.filter(
    (category) => category.status === "Active"
  ).length;
  inactiveExpertise.textContent = expertiseCategories.filter(
    (category) => category.status === "Inactive"
  ).length;
  usedCategories.textContent = expertiseCategories.filter(
    (category) => Number(category.usedBy) > 0
  ).length;
}

function clearForm() {
  expertiseForm.reset();
  editIndex.value = "";
  formTitle.textContent = "Add Expertise Category";
  submitBtn.textContent = "Save Expertise";
}

function getFormData() {
  return {
    expertiseName: expertiseNameInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusInput.value,
    usedBy: Number(usedByInput.value)
  };
}

expertiseForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const expertiseData = getFormData();
  const currentEditIndex = editIndex.value;

  try {
    let response;

    if (currentEditIndex === "") {
      response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(expertiseData)
      });

      if (!response.ok) {
        throw new Error("Failed to add expertise category.");
      }

      alert("Expertise category added successfully.");
    } else {
      const categoryId = expertiseCategories[currentEditIndex].id;

      response = await fetch(`${API_BASE_URL}/${categoryId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(expertiseData)
      });

      if (!response.ok) {
        throw new Error("Failed to update expertise category.");
      }

      alert("Expertise category updated successfully.");
    }

    clearForm();
    await loadExpertise();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

function editExpertise(index) {
  const category = expertiseCategories[index];

  editIndex.value = index;
  expertiseNameInput.value = category.expertiseName;
  descriptionInput.value = category.description;
  statusInput.value = category.status;
  usedByInput.value = category.usedBy;

  formTitle.textContent = "Edit Expertise Category";
  submitBtn.textContent = "Update Expertise";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function toggleExpertiseStatus(index) {
  const category = expertiseCategories[index];
  const newStatus = category.status === "Active" ? "Inactive" : "Active";

  try {
    const response = await fetch(`${API_BASE_URL}/${category.id}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status: newStatus
      })
    });

    if (!response.ok) {
      throw new Error("Failed to update expertise status.");
    }

    await loadExpertise();
  } catch (error) {
    console.error(error);
    alert("Failed to update expertise status.");
  }
}

function refreshView() {
  renderExpertise(expertiseStatusFilter.value);
  updateStats();
}

expertiseStatusFilter.addEventListener("change", function () {
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

loadExpertise();
