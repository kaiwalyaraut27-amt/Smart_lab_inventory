// ✅ src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  getSubjects,
  getAllRequests,
  approveRequest,
  denyRequest,
  resetAllRequests,
  addSubject,
  addItem,
  addLab,
  getLabsBySubject,
} from "../api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [view, setView] = useState("subjects");
  const [subjects, setSubjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequests, setProcessingRequests] = useState([]); // array of request_ids currently being processed
  const [addingSubject, setAddingSubject] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [addingLab, setAddingLab] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "" });
  const [itemForm, setItemForm] = useState({
    subject_id: "",
    lab_id: "",
    item_name: "",
    quantity: "",
    description: "",
  });
  const [labForm, setLabForm] = useState({ subject_id: '', lab_name: '' });
  const [labsForSubject, setLabsForSubject] = useState([]);
  const navigate = useNavigate();

  // ✅ Load subjects on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) return navigate("/login");
    if (role !== "admin") return navigate("/dashboard/student");

    async function loadSubjects() {
      setLoadingSubjects(true);
      try {
        const res = await getSubjects(token);
        const list = (res && (res.subjects || res.data)) || [];
        if (res.success) setSubjects(list);
      } catch (err) {
        console.error("Error loading subjects:", err);
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, [navigate]);

  // ✅ Load all requests
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

  // ✅ Approve / Deny requests
 // ✅ Handle approve/deny actions safely
const [processingId, setProcessingId] = useState(null);

const handleAction = async (id, action) => {
  if (processingId === id) {
    console.warn("⏳ Action already in progress for this request.");
    return;
  }

  const confirmMsg = `Are you sure you want to ${action} request #${id}?`;
  if (!window.confirm(confirmMsg)) return;

  setProcessingId(id);
  try {
    const token = localStorage.getItem("token");
    const apiFunc = action === "approve" ? approveRequest : denyRequest;
    const res = await apiFunc(id, token);

    console.log("🔍 DEBUG RESPONSE:", res);

    if (res.success) {
      alert(`Request ${action}d successfully!`);
      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === id
            ? { ...r, status: action === "approve" ? "approved" : "denied" }
            : r
        )
      );
    } else {
      alert(res.message || "Action failed.");
    }
  } catch (err) {
    console.error(`[AdminDashboard] ${action} error:`, err);
    alert("Error while processing request. Check console.");
  } finally {
    setProcessingId(null);
  }
};


  // ✅ Reset all requests
  const handleResetAll = async () => {
    if (
      !confirm(
        "Reset all requests? This will mark all as returned and clear the requests table."
      )
    )
      return;
    const token = localStorage.getItem("token");
    const res = await resetAllRequests(token);
    if (res.success) setRequests([]);
    else alert(res.message || "Reset failed");
  };

  // ✅ Add Subject
  const handleAddSubject = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    if (!subjectForm.name) return alert("Please enter subject name");

    setAddingSubject(true);
    const res = await addSubject(
      {
        subject_name: subjectForm.name,
        description: subjectForm.description,
      },
      token
    );
    setAddingSubject(false);

    if (res.success) {
      alert("Subject added successfully");
      setSubjectForm({ name: "", description: "" });
      const reload = await getSubjects(token);
      if (reload && (reload.subjects || reload.data))
        setSubjects(reload.subjects || reload.data);
    } else alert(res.message || "Failed to add subject");
  };

  // ✅ Add Item
  const handleAddItem = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    if (!itemForm.subject_id || !itemForm.item_name || !itemForm.quantity)
      return alert("Please fill all required fields");

    setAddingItem(true);
    const payload = {
      subject_id: itemForm.subject_id,
      item_name: itemForm.item_name,
      quantity: parseInt(itemForm.quantity),
      description: itemForm.description,
    };
    if (itemForm.lab_id) payload.lab_id = itemForm.lab_id;

    const res = await addItem(payload, token);
    setAddingItem(false);

    if (res.success) {
      alert("Item added successfully");
      setItemForm({
        subject_id: "",
        lab_id: '',
        item_name: "",
        quantity: "",
        description: "",
      });
    } else alert(res.message || "Failed to add item");
  };

  return (
    <>
      <Navbar />
      <div
        style={{
          background: "#000",
          color: "#fff",
          minHeight: "100vh",
          padding: "40px",
          textAlign: "center",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2 style={{ color: "#00ffff", margin: 0, textAlign: "center" }}>🛠️ Admin Dashboard</h2>
            <p style={{ color: "#aaa", marginTop: "5px" }}>
              Manage subjects, items, and requests
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setView("subjects")}
              style={view === "subjects" ? pillActive : pill}
            >
              View Subjects
            </button>
            <button
              onClick={() => {
                setView("requests");
                loadRequests();
              }}
              style={view === "requests" ? pillActive : pill}
            >
              View Requests
            </button>
          </div>
        </header>

        {/* SUBJECTS VIEW */}
        {view === "subjects" && (
          <section>
            <h3 style={{ color: "#ccc" }}>All Subjects</h3>
            {loadingSubjects ? (
              <p style={{ color: "#888" }}>Loading subjects...</p>
            ) : subjects.length === 0 ? (
              <p style={{ color: "#888" }}>No subjects found.</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  flexWrap: "wrap",
                  justifyContent: "center",
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
                    }}
                  >
                    <h4 style={{ color: "#fff", marginBottom: "6px" }}>
                      {s.subject_name}
                    </h4>
                    <p style={{ color: "#bbb" }}>
                      {s.description || "No description provided"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Subject */}
            <div
              style={{
                background: "#111",
                border: "1px solid #00ffff",
                borderRadius: "10px",
                padding: "20px",
                width: "400px",
                margin: "30px auto",
              }}
            >
              <h4 style={{ color: "#00ffff" }}>➕ Add Subject</h4>
              <input
                placeholder="Subject Name"
                value={subjectForm.name}
                onChange={(e) =>
                  setSubjectForm((prev) => ({ ...prev, name: e.target.value }))
                }
                style={input}
              />
              <textarea
                placeholder="Description (optional)"
                value={subjectForm.description}
                onChange={(e) =>
                  setSubjectForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                style={{ ...input, minHeight: 60 }}
              />
              <button
                onClick={handleAddSubject}
                style={addBtn}
                disabled={addingSubject}
              >
                {addingSubject ? "Adding..." : "Add Subject"}
              </button>
            </div>

            {/* duplicate Add Lab removed */}

            {/* Add Item */}
            <div
              style={{
                background: "#111",
                border: "1px solid #00ffff",
                borderRadius: "10px",
                padding: "20px",
                width: "400px",
                margin: "30px auto",
              }}
            >
              <h4 style={{ color: "#00ffff" }}>➕ Add Item</h4>
              <select
                value={itemForm.subject_id}
                onChange={async (e) => {
                  const subjId = e.target.value;
                  setItemForm((prev) => ({ ...prev, subject_id: subjId }));
                  // fetch labs for this subject so the lab selector can be populated
                  if (!subjId) {
                    setLabsForSubject([]);
                    return;
                  }
                  const token = localStorage.getItem('token');
                  const labsRes = await getLabsBySubject(subjId, token);
                  const labs = (labsRes && (labsRes.labs || labsRes.data)) || [];
                  setLabsForSubject(labs);
                }}
                style={input}
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_name}
                  </option>
                ))}
              </select>

              {/* Lab selector populated after subject selected */}
              <select
                value={itemForm.lab_id || ''}
                onChange={(e) => setItemForm(prev => ({ ...prev, lab_id: e.target.value }))}
                style={input}
              >
                <option value=''>-- Select lab (optional) --</option>
                {labsForSubject.map(l => <option key={l.lab_id || l.id} value={l.lab_id || l.id}>{l.lab_name || l.name}</option>)}
              </select>
              <input
                placeholder="Item Name"
                value={itemForm.item_name}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    item_name: e.target.value,
                  }))
                }
                style={input}
              />
              <input
                placeholder="Quantity"
                type="number"
                value={itemForm.quantity}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                style={input}
              />
              <textarea
                placeholder="Description (optional)"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                style={{ ...input, minHeight: 60 }}
              />
              <button
                onClick={handleAddItem}
                style={addBtn}
                disabled={addingItem}
              >
                {addingItem ? "Adding..." : "Add Item"}
              </button>
            </div>

            {/* Add Lab */}
            <div
              style={{
                background: "#111",
                border: "1px solid #00ffff",
                borderRadius: "10px",
                padding: "20px",
                width: "400px",
                margin: "30px auto",
              }}
            >
              <h4 style={{ color: "#00ffff" }}>➕ Add Lab</h4>
              <select
                value={labForm.subject_id}
                onChange={(e) =>
                  setLabForm((prev) => ({ ...prev, subject_id: e.target.value }))
                }
                style={input}
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Lab Name"
                value={labForm.lab_name}
                onChange={(e) =>
                  setLabForm((prev) => ({ ...prev, lab_name: e.target.value }))
                }
                style={input}
              />
              <button
                onClick={async () => {
                  const token = localStorage.getItem("token");
                  if (!token) return navigate("/login");
                  if (!labForm.subject_id || !labForm.lab_name)
                    return alert("Please select subject and lab name");
                  setAddingLab(true);
                  const res = await addLab({ subject_id: labForm.subject_id, lab_name: labForm.lab_name }, token);
                  setAddingLab(false);
                  if (res.success) {
                    alert("Lab added successfully");
                    setLabForm({ subject_id: '', lab_name: '' });
                  } else alert(res.message || "Failed to add lab");
                }}
                style={addBtn}
                disabled={addingLab}
              >
                {addingLab ? "Adding..." : "Add Lab"}
              </button>
            </div>
          </section>
        )}

        {/* REQUESTS VIEW */}
        {view === "requests" && (
          <section>
            <h3 style={{ color: "#ccc" }}>All Student Requests</h3>
            {loadingRequests ? (
              <p style={{ color: "#888" }}>Loading requests...</p>
            ) : requests.length === 0 ? (
              <p style={{ color: "#888" }}>No requests found.</p>
            ) : (
              <div style={{ marginTop: "20px" }}>
                <table
                  style={{
                    width: "95%",
                    margin: "auto",
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
                      <tr
                        key={r.request_id}
                        style={{ borderBottom: "1px solid #00ffff33" }}
                      >
                        <td style={td}>{r.request_id}</td>
                        <td style={td}>{r.student_name}</td>
                        <td style={td}>{r.item_name}</td>
                        <td style={td}>{r.quantity}</td>
                        <td style={td}>{r.status}</td>
                        <td style={td}>
                          {r.status === "pending" ? (
                            <>
                              <button
                                onClick={async () => {
                                  if (processingRequests.includes(r.request_id)) return;
                                  await handleAction(r.request_id, "approve");
                                }}
                                style={approveBtn}
                                disabled={processingRequests.includes(r.request_id)}
                              >
                                {processingRequests.includes(r.request_id) ? 'Processing...' : 'Approve'}
                              </button>



                              <button
                                onClick={() =>
                                  handleAction(r.request_id, "deny")
                                }
                                style={denyBtn}
                              >
                                Deny
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
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={handleResetAll}
                    style={{
                      background: "#ff5555",
                      color: "#fff",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Reset All Requests
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

/* === Styles === */
const th = { padding: "10px", borderBottom: "1px solid #00ffff44" };
const td = { padding: "10px" };
const pill = {
  background: "transparent",
  color: "#00ffff",
  border: "1px solid #00ffff",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};
const pillActive = { ...pill, background: "#00ffff", color: "#000" };
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
const input = {
  width: "100%",
  background: "#000",
  color: "#fff",
  border: "1px solid #00ffff",
  padding: "8px",
  borderRadius: "5px",
  marginBottom: "10px",
};
const addBtn = {
  background: "#00ffff",
  color: "#000",
  padding: "8px 14px",
  borderRadius: "5px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
};
