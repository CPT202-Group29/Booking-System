const API_BASE = "http://121.196.221.244:8080";
const slotForm = document.getElementById("slotForm");

function showMessage(text, type) {
  alert(text);
}

slotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const specialistId = document.getElementById("specialistId").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;

  if (!specialistId || !startTime || !endTime) {
    showMessage("Please fill all fields", "error");
    return;
  }
  if (new Date(startTime) >= new Date(endTime)) {
    showMessage("Start time must be before end time", "error");
    return;
  }

  const data = {
    specialistId: parseInt(specialistId),
    startTime: startTime + ":00",
    endTime: endTime + ":00",
    isAvailable: true
  };

  try {
    const response = await fetch(`${API_BASE}/api/v1/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to create slot");
    }
    showMessage("Slot created successfully", "success");
    slotForm.reset();
  } catch (error) {
    console.error("Create slot error:", error);
    showMessage(error.message, "error");
  }
});
