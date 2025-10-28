// ✅ src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  getSubjects,
  getAllRequests,
  approveRequest,
  denyRequest,
  updateItemStock,
  getItemsByLab,
  // add getItemById
  getItemById,
} from "../api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [view, setView] = useState("subjects"); // subjects | requests | items
  const [subjects, setSubjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [processingRequests, setProcessingRequests] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const navigate = useNavigate();

  // ✅ Initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    let role = localStorage.getItem("role") || null;

    if (!token) {
      navigate("/login");
      return;
    }

    // normalize role (case-insensitive) and fallback to token payload if localStorage missing
    try {
      role = (role || "").toString().toLowerCase();
      if (!role) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        role = (payload?.role || "").toString().toLowerCase();
      }
    } catch (e) {
      role = (role || "").toString().toLowerCase();
    }

    if (role !== "admin") {
      navigate("/dashboard/student");
      return;
    }

    async function loadSubjects() {
      setLoadingSubjects(true);
      try {
        const res = await getSubjects(token);
        if (res.success && res.subjects) setSubjects(res.subjects);
      } catch (err) {
        console.error("Error loading subjects:", err);
      } finally {
        setLoadingSubjects(false);
      }
    }

    loadSubjects();
  }, [navigate]);

  // ✅ Load requests
  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem("token");
      const res = await getAllRequests(token);
      if (res.success && res.data) setRequests(res.data);
      else setRequests([]);
    } catch (err) {
      console.error("Error loading requests:", err);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // ✅ Load all items from first lab (for stock management)
  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const token = localStorage.getItem("token");
      // you can change "1" to any lab_id that exists
      const res = await getItemsByLab(1, token);
      if (res.success && res.items) setItems(res.items);
    } catch (err) {
      console.error("Error loading items:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  // ✅ Approve or deny request
  const handleAction = async (id, action) => {
    const ok = window.confirm(`Are you sure you want to ${action} request #${id}?`);
    if (!ok) return;
    if (processingRequests.includes(id)) return;
    setProcessingRequests(p => [...p, id]);

    const token = localStorage.getItem("token");
    const apiFunc = action === "approve" ? approveRequest : denyRequest;
    try {
      const res = await apiFunc(id, token);
      if (res.success) {
        alert(`Request ${action}d successfully!`);
        setRequests((prev) =>
          prev.map((r) =>
            r.request_id === id ? { ...r, status: action === "approve" ? "approved" : "denied" } : r
          )
        );
        // If the backend included item updates, apply them to local items state
        if (res.item_id !== undefined && res.item_quantity !== undefined) {
          setItems((prev) =>
            prev.map((it) => (it.item_id === res.item_id ? { ...it, quantity: res.item_quantity } : it))
          );
          // fetch the latest item record (contains lab_id etc) and replace in items list
          try {
            const token = localStorage.getItem('token');
            const itemResp = await getItemById(res.item_id, token);
            if (itemResp && itemResp.success && itemResp.data) {
              setItems(prev => {
                const found = prev.some(it => it.item_id === itemResp.data.item_id);
                if (found) return prev.map(it => it.item_id === itemResp.data.item_id ? {
                  item_id: itemResp.data.item_id,
                  item_name: itemResp.data.item_name,
                  quantity: itemResp.data.quantity,
                  lab_name: it.lab_name || ''
                } : it);
                // otherwise add it (admin items view shows first-lab items so this may be optional)
                return [...prev, {
                  item_id: itemResp.data.item_id,
                  item_name: itemResp.data.item_name,
                  quantity: itemResp.data.quantity,
                  lab_name: ''
                }];
              });
            }
          } catch (e) {
            // ignore non-fatal
          }
        }
      }
    } catch (err) {
      console.error('Action error:', err);
      alert('Server error while performing action');
    } finally {
      setProcessingRequests(p => p.filter(x => x !== id));
    }
  };

  // ✅ Handle stock update
  const handleStockUpdate = async (item_id) => {
    const token = localStorage.getItem("token");
    const input = document.getElementById(`stock-${item_id}`);
    const amount = parseInt(input.value);
    if (isNaN(amount)) return alert("Enter a valid number!");

    const res = await updateItemStock(item_id, amount, token);
    alert(res.message);
    input.value = "";
    loadItems();
  };

  // ✅ Styling constants
  const th = { padding: "10px", borderBottom: "1px solid #00ffff44" };
  const td = { padding: "10px" };
  const approveBtn = {
    background: "#00ffff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
    marginRight: "8px",
    color: "#000",
    fontWeight: "bold",
  };
  const denyBtn = {
    background: "#ff5555",
    border: "none",
    padding: "5px 10px",
    borderRadius: "5px",
    color: "#fff",
    fontWeight: "bold",
  };

  return (
    <>
      <Navbar />
      <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #00ffff",
            paddingBottom: "15px",
          }}
        >
          <div>
            <h2 style={{ color: "#00ffff", margin: 0, textAlign: "center" }}>🛠️ Admin Dashboard</h2>
            <p style={{ color: "#aaa", marginTop: "5px", textAlign: "center" }}>
              Manage subjects, requests, and stock
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setView("subjects")}
              style={{
                background: view === "subjects" ? "#00ffff" : "transparent",
                color: view === "subjects" ? "#000" : "#00ffff",
                border: "1px solid #00ffff",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              View Subjects
            </button>
            <button
              onClick={() => {
                setView("requests");
                loadRequests();
              }}
              style={{
                background: view === "requests" ? "#00ffff" : "transparent",
                color: view === "requests" ? "#000" : "#00ffff",
                border: "1px solid #00ffff",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              View Requests
            </button>
            <button
              onClick={() => {
                setView("items");
                loadItems();
              }}
              style={{
                background: view === "items" ? "#00ffff" : "transparent",
                color: view === "items" ? "#000" : "#00ffff",
                border: "1px solid #00ffff",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Manage Stock
            </button>
          </div>
        </header>

        {/* 📘 Subjects view */}
        {view === "subjects" && (
          <section>
            <h3 style={{ color: "#ccc", marginTop: "25px", textAlign: "center" }}>All Subjects</h3>
            {loadingSubjects ? (
              <p style={{ color: "#888" }}>Loading subjects...</p>
            ) : subjects.length === 0 ? (
              <p style={{ color: "#888" }}>No subjects found.</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >
                {subjects.map((s) => (
                  <div
                    key={s.subject_id}
                    style={{
                      width: "260px",
                      background: "#111",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #00ffff",
                      textAlign: "center",
                    }}
                  >
                    <h4 style={{ color: "#fff", marginBottom: "6px", textAlign: "center" }}>{s.subject_name}</h4>
                    <p style={{ color: "#bbb", textAlign: "center" }}>
                      {s.description || "No description provided"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 📋 Requests view */}
        {view === "requests" && (
          <section>
            <h3 style={{ color: "#ccc", marginTop: "25px" }}>All Student Requests</h3>
            {loadingRequests ? (
              <p style={{ color: "#888" }}>Loading requests...</p>
            ) : requests.length === 0 ? (
              <p style={{ color: "#888" }}>No requests found.</p>
            ) : (
              <table
                style={{
                  width: "95%",
                  margin: "20px auto",
                  borderCollapse: "collapse",
                  background: "#111",
                }}
              >
                <thead>
                  <tr style={{ background: "#00ffff22", color: "#00ffff" }}>
                    <th style={th}>Request ID</th>
                    <th style={th}>Student</th>
                    <th style={th}>Item</th>
                    <th style={th}>Quantity</th>
                    <th style={th}>Status</th>
                    <th style={th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.request_id} style={{ borderBottom: "1px solid #00ffff33" }}>
                      <td style={td}>{r.request_id}</td>
                      <td style={td}>{r.student_name}</td>
                      <td style={td}>{r.item_name}</td>
                      <td style={td}>{r.quantity}</td>
                      <td style={td}>{r.status}</td>
                      <td style={td}>
                        {r.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleAction(r.request_id, "approve")}
                              style={approveBtn}
                              disabled={processingRequests.includes(r.request_id)}
                            >
                              {processingRequests.includes(r.request_id) ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleAction(r.request_id, "deny")}
                              style={denyBtn}
                              disabled={processingRequests.includes(r.request_id)}
                            >
                              {processingRequests.includes(r.request_id) ? 'Processing...' : 'Deny'}
                            </button>
                          </>
                        ) : (
                          <span style={{ color: "#00ff99" }}>{r.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* 🧰 Stock Management */}
        {view === "items" && (
          <section>
            <h3 style={{ color: "#ccc", marginTop: "25px" }}>Manage Item Stock</h3>
            {loadingItems ? (
              <p style={{ color: "#888" }}>Loading items...</p>
            ) : items.length === 0 ? (
              <p style={{ color: "#888" }}>No items found.</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >
                {items.map((item) => (
                  <div
                    key={item.item_id}
                    style={{
                      border: "1px solid #00ffff",
                      borderRadius: "10px",
                      padding: "15px",
                      margin: "10px",
                      background: "#111",
                      color: "#fff",
                      width: "260px",
                      textAlign: "left",
                    }}
                  >
                    <h3>{item.item_name}</h3>
                    <p>Quantity: {item.quantity}</p>

                    <div style={{ marginTop: "10px" }}>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        style={{
                          width: "120px",
                          padding: "5px",
                          borderRadius: "5px",
                          border: "1px solid #00ffff",
                          background: "#000",
                          color: "#fff",
                          marginRight: "8px",
                        }}
                        id={`stock-${item.item_id}`}
                      />
                      <button
                        onClick={() => handleStockUpdate(item.item_id)}
                        style={{
                          background: "#00ffff",
                          color: "#000",
                          padding: "6px 12px",
                          borderRadius: "5px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Add Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
