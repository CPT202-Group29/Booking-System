let specialists = [
  {
    name: "Dr. Alice Smith",
    expertise: "Psychology",
    level: "Senior",
    fee: 150.00,
    status: "Available",
    contact: "alice@example.com",
    description: "Experienced psychologist with 10 years in clinical practice."
  },
  {
    name: "Dr. Johnson",
    expertise: "Career Advice",
    level: "Intermediate",
    fee: 120.00,
    status: "Available",
    contact: "johnson@example.com",
    description: "Provides career guidance and professional development support."
  },
  {
    name: "Dr. Lee",
    expertise: "Academic Support",
    level: "Junior",
    fee: 90.00,
    status: "Available",
    contact: "lee@example.com",
    description: "Supports students with academic planning and study advice."
  }
];

const specialistTableBody = document.getElementById("specialistTableBody");
const specialistForm = document.getElementById("specialistForm");
const statusFilter = document.getElementById("statusFilter");

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

function renderSpecialists(status = "All") {
  specialistTableBody.innerHTML = "";

  const filteredSpecialists =
    status === "All"
      ? specialists
      : specialists.filter((specialist) => specialist.status === status);

  filteredSpecialists.forEach((specialist) => {
    const realIndex = specialists.indexOf(specialist);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${specialist.name}</td>
      <td>${specialist.expertise}</td>
      <td>${specialist.level}</td>
      <td>${Number(specialist.fee).toFixed(2)}</td>
      <td>
        <span class="badge ${specialist.status.toLowerCase()}">
          ${specialist.status}
        </span>
      </td>
      <td>${specialist.contact}</td>
      <td class="description-cell">${specialist.description}</td>
      <td>
        <button class="table-btn edit-btn" onclick="editSpecialist(${realIndex})">Edit</button>
        <button class="table-btn disable-btn" onclick="toggleSpecialistStatus(${realIndex})">
          ${specialist.status === "Available" ? "Set Unavailable" : "Set Available"}
        </button>
      </td>
    `;

    specialistTableBody.appendChild(row);
  });
}

function clearForm() {
  specialistForm.reset();
  editIndex.value = "";
  formTitle.textContent = "Add Specialist";
  submitBtn.textContent = "Save Specialist";
}

function getFormData() {
  return {
    name: nameInput.value.trim(),
    expertise: expertiseInput.value.trim(),
    level: levelInput.value,
    fee: Number(feeInput.value),
    status: statusInput.value,
    contact: contactInput.value.trim(),
    description: descriptionInput.value.trim()
  };
}

specialistForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const specialistData = getFormData();
  const currentEditIndex = editIndex.value;

  if (currentEditIndex === "") {
    specialists.push(specialistData);
    alert("Specialist added successfully.");
  } else {
    specialists[currentEditIndex] = specialistData;
    alert("Specialist updated successfully.");
  }

  clearForm();
  renderSpecialists(statusFilter.value);
});

function editSpecialist(index) {
  const specialist = specialists[index];

  editIndex.value = index;
  nameInput.value = specialist.name;
  expertiseInput.value = specialist.expertise;
  levelInput.value = specialist.level;
  feeInput.value = specialist.fee;
  statusInput.value = specialist.status;
  contactInput.value = specialist.contact;
  descriptionInput.value = specialist.description;

  formTitle.textContent = "Edit Specialist";
  submitBtn.textContent = "Update Specialist";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function toggleSpecialistStatus(index) {
  specialists[index].status =
    specialists[index].status === "Available" ? "Unavailable" : "Available";

  renderSpecialists(statusFilter.value);
}

statusFilter.addEventListener("change", function () {
  renderSpecialists(this.value);
});

resetBtn.addEventListener("click", clearForm);

showFormBtn.addEventListener("click", function () {
  clearForm();
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

renderSpecialists();
