const API_BASE = "http://47.111.224.168:8080";

function mapBooking(item) {
  return {
    id: item.id,
    customer: item.customerId,
    specialist: item.specialistId,
    topic: item.topic,
    date: item.date,
    time: item.time,
    fee: item.chargeAmount,
    status: item.status,
  };
}

export async function getBookings(status = "ALL") {
  let url = `${API_BASE}/api/v1/bookings`;
  if (status !== "ALL") {
    url += `?status=${status}`;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }

  const data = await response.json();
  return data.map(mapBooking);
}

export async function confirmBooking(id) {
  const response = await fetch(`${API_BASE}/api/v1/bookings/${id}/confirm`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error("Failed to confirm booking");
  }

  return response.json();
}

// 管理员取消（与用户取消区分，避免函数名冲突）
export async function cancelBookingAdmin(id) {
  const response = await fetch(`${API_BASE}/api/v1/bookings/${id}/admin-cancel`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error("Failed to cancel booking");
  }

  return response.json();
}

export async function completeBooking(id) {
  const response = await fetch(`${API_BASE}/api/v1/bookings/${id}/complete`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error("Failed to complete booking");
  }

  return response.json();
}
