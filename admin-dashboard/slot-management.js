const API_BASE = "";
const slotForm = document.getElementById("slotForm");
const slotListBody = document.getElementById("slotListBody");
let editingSlotId = null;

// 认证头函数（新增）
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

slotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const specialistId = document.getElementById("specialistId").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;

  if (!specialistId || !startTime || !endTime) {
    alert("Please fill all fields");
    return;
  }
  if (new Date(startTime) >= new Date(endTime)) {
    alert("Start time must be before end time");
    return;
  }

  const data = {
    specialistId: parseInt(specialistId),
    startTime: startTime + ":00",
    endTime: endTime + ":00",
    isAvailable: true
  };

  try {
    const url = editingSlotId
      ? `${API_BASE}/api/v1/slots/${editingSlotId}`
      : `${API_BASE}/api/v1/slots`;
    const response = await fetch(url, {
      method: editingSlotId ? "PUT" : "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to save slot");
    }
    alert(editingSlotId ? "Slot updated successfully" : "Slot created successfully");
    slotForm.reset();
    document.getElementById("submitBtn").textContent = "Save Slot";
    editingSlotId = null;
    loadSlots();
  } catch (error) {
    console.error("Save slot error:", error);
    alert(error.message);
  }
});

async function loadSlots() {
  try {
    // 添加认证头（修改点）
    const response = await fetch(`${API_BASE}/api/v1/slots/all`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to load slots");
    const slots = await response.json();
    renderSlots(slots);
  } catch (error) {
    console.error("Load slots error:", error);
    slotListBody.innerHTML = `<tr><td colspan="5">Failed to load slots.</td></tr>`;
  }
}

function renderSlots(slots) {
  if (!slotListBody) return;
  if (slots.length === 0) {
    slotListBody.innerHTML = `<tr><td colspan="5">No time slots found.</td></tr>`;
    return;
  }
  slotListBody.innerHTML = slots
    .map((slot) => {
      const start = new Date(slot.startTime).toLocaleString();
      const end = new Date(slot.endTime).toLocaleString();
      return `
        <tr>
          <td>${slot.id}</td>
          <td>${slot.specialistId}</td>
          <td>${start}</td>
          <td>${end}</td>
          <td>
            <button class="table-btn edit-btn" onclick="editSlot(${slot.id}, '${slot.startTime}', '${slot.endTime}', ${slot.specialistId})">Edit</button>
            <button class="table-btn cancel-btn" onclick="deleteSlot(${slot.id})">Delete</button>
          </td>
        </tr>`;
    })
    .join("");
}

window.editSlot = function (id, start, end, specialistId) {
  editingSlotId = id;
  document.getElementById("specialistId").value = specialistId;
  document.getElementById("startTime").value = start.substring(0, 16);
  document.getElementById("endTime").value = end.substring(0, 16);
  document.getElementById("submitBtn").textContent = "Update Slot";
};

window.deleteSlot = async function (id) {
  if (!confirm("Are you sure you want to delete this slot?")) return;
  try {
    const response = await fetch(`${API_BASE}/api/v1/slots/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to delete slot");
    }
    alert("Slot deleted successfully");
    loadSlots();
  } catch (error) {
    console.error("Delete slot error:", error);
    alert(error.message);
  }
};

loadSlots();
