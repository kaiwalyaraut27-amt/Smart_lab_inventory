// ✅ src/api.js

// Automatically switch between local and deployed URLs
const API_BASE =
  import.meta.env.MODE === "development"
    ? "http://localhost:5050/api" // used when running locally
    : "https://smart-lab-inventory.onrender.com/api"; // 🔥 your Render backend URL

// 🧠 Helper to safely parse JSON responses
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('[api] Server returned non-JSON:', text);
      return { success: false, message: 'Invalid server response' };
    }

    if (!res.ok) {
      return { success: false, message: data.message || `Request failed (${res.status})` };
    }

    return data;
  } catch (err) {
    console.error('[api] Fetch error:', err);
    return { success: false, message: 'Server not reachable' };
  }
}


// (Keep the rest of your functions — signupUser, getSubjects, createRequest, etc.)

// 🧠 Helper to safely parse JSON responses
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('[api] Server returned non-JSON:', text);
      return { success: false, message: 'Invalid server response' };
    }

    if (!res.ok) {
      return { success: false, message: data.message || `Request failed (${res.status})` };
    }

    return data;
  } catch (err) {
    console.error('[api] Fetch error:', err);
    return { success: false, message: 'Server not reachable' };
  }
}

// ✅ Signup API
export async function signupUser(data) {
  return safeFetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ✅ Login API
export async function loginUser(data) {
  return safeFetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ✅ Final clean version
export async function getSubjects(token) {
  return safeFetch(`${API_BASE}/subjects`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}
// ✅ Get Labs by Subject
export async function getLabsBySubject(subject_id, token) {
  const res = await safeFetch(`${API_BASE}/labs/${subject_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  // normalize for backward compatibility (some code expects `labs`)
  if (res && res.success) return { ...res, labs: res.data };
  return res;
}
export async function getItemsByLab(id, token) {
  const res = await safeFetch(`${API_BASE}/items/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (res && res.success) return { ...res, items: res.data };
  return res;
}

export async function getItemById(item_id, token) {
  return safeFetch(`${API_BASE}/items/id/${item_id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Admin/Teacher: add a new subject
export async function addSubject(data, token) {
  return safeFetch(`${API_BASE}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

// Admin/Teacher: add a new item (requires lab_id)
export async function addItem(data, token) {
  return safeFetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

// Admin/Teacher: add a new lab (attach to a subject)
export async function addLab(data, token) {
  return safeFetch(`${API_BASE}/labs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

// Create new item request
export async function createRequest(data, token) {
  return safeFetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

// Student: My Requests
export async function getMyRequests(token) {
  return safeFetch(`${API_BASE}/requests/mine`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Admin: All Requests
export async function getAllRequests(token) {
  return safeFetch("http://localhost:5050/api/requests", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}


// Admin Approve/Deny
export async function approveRequest(id, token) {
  return safeFetch(`${API_BASE}/requests/${id}/approve`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function denyRequest(id, token) {
  return safeFetch(`${API_BASE}/requests/${id}/deny`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Admin: reset all requests (mass return + clear)
export async function resetAllRequests(token) {
  return safeFetch(`${API_BASE}/requests/reset`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

const api = {
  signupUser,
  loginUser,
  getSubjects,
  getLabsBySubject,
  getItemsByLab,
  createRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  denyRequest,
  resetAllRequests,
  returnItem, // ✅ added here
  addSubject,
  addItem,
  addLab,
};
export default api;

// ✅ Return item (Student)
export async function returnItem(requestId, token) {
  return safeFetch(`${API_BASE}/requests/${requestId}/return`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

// ✅ Admin: Update item stock
export async function updateItemStock(item_id, amount, token) {
  return safeFetch(`${API_BASE}/items/stock/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ item_id, amount }),
  });
}
