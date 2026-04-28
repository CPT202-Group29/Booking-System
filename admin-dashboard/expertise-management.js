let expertiseCategories = [
  {
    expertiseName: "Academic Support",
    description: "Consultation for study planning, academic progress, and learning difficulties.",
    status: "Active",
    usedBy: 3
  },
  {
    expertiseName: "Career Advice",
    description: "Guidance on career planning, CV improvement, and interview preparation.",
    status: "Active",
    usedBy: 2
  },
  {
    expertiseName: "Mental Health Support",
    description: "Support for stress management, wellbeing, and personal adjustment.",
    status: "Active",
    usedBy: 1
  },
  {
    expertiseName: "Technical Consulting",
    description: "Advice on software projects, technical planning, and implementation issues.",
    status: "Inactive",
    usedBy: 0
  }
];

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
    (category) => category.usedBy > 0
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

expertiseForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const expertiseData = getFormData();
  const currentEditIndex = editIndex.value;

  if (currentEditIndex === "") {
    expertiseCategories.push(expertiseData);
    alert("Expertise category added successfully.");
  } else {
    expertiseCategories[currentEditIndex] = expertiseData;
    alert("Expertise category updated successfully.");
  }

  clearForm();
  refreshView();
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

function toggleExpertiseStatus(index) {
  expertiseCategories[index].status =
    expertiseCategories[index].status === "Active" ? "Inactive" : "Active";

  refreshView();
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

refreshView();
