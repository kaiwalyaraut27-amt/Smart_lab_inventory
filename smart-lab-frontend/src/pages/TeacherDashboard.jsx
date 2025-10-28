import React, { useEffect, useState } from "react";
import { getAllRequests, approveRequest, denyRequest, getSubjects, addSubject, addItem, getLabsBySubject, addLab } from "../api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

/**
 * Teacher dashboard now:
 * - shows Subjects by default
 * - has a "Requests" tab/button that, when clicked, loads requests
 * - optionally filters requests so approve/deny appear only for teacher-owned requests
 */

export default function TeacherDashboard() {
  const [view, setView] = useState("subjects"); // "subjects" | "requests"
  const [subjects, setSubjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [processingRequests, setProcessingRequests] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ subject_id: '', subject_name: '', description: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [itemForm, setItemForm] = useState({ subject_id: '', lab_id: '', item_name: '', quantity: '' });
  const [labsForSubject, setLabsForSubject] = useState([]);
  const [labForm, setLabForm] = useState({ subject_id: '', lab_name: '' });
  const navigate = useNavigate();

  // read token-payload to get user id (if available in token)
  const token = localStorage.getItem("token");
  let currentUserId = null;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      // token should contain user_id or id depending on backend
      currentUserId = payload.user_id ?? payload.id ?? null;
    }
  } catch (e) {
    // ignore decode errors
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) {
      navigate("/login");
      return;
    }
    if (role !== "teacher") {
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

  // load requests only when teacher clicks the Requests view
  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem("token");
      const res = await getAllRequests(token);
      if (res.success && res.data) {
        // OPTIONAL: filter requests to those this teacher should handle.
        // This requires backend to include a field like `assigned_teacher_id` or `subject_teacher_id`.
        // If your backend doesn't return such a field, comment out filtering below.
        const filtered = res.data.filter((r) => {
          // If request has teacher_id / assigned_teacher_id, use that; otherwise keep all.
          if (r.assigned_teacher_id) return r.assigned_teacher_id === currentUserId;
          if (r.teacher_id) return r.teacher_id === currentUserId;
          // fallback: don't filter (show all) — remove or change as needed
          return true;
        });
        setRequests(filtered);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error loading requests:", err);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Approve/Deny handlers (ask for confirmation)
  const handleAction = async (id, action) => {
    const ok = window.confirm(`Are you sure you want to ${action} request #${id}?`);
    if (!ok) return;
    if (processingRequests.includes(id)) return;
    setProcessingRequests(p => [...p, id]);
    const token = localStorage.getItem("token");
    const apiFunc = action === "approve" ? approveRequest : denyRequest;
    // Add guard to prevent duplicate processing (e.g., double-click)
    try {
      const res = await apiFunc(id, token);
      if (res.success) {
        // update local state
        setRequests((prev) => prev.map((r) => (r.request_id === id ? { ...r, status: action === "approve" ? "approved" : "denied" } : r)));
        if (res.item_id !== undefined && res.item_quantity !== undefined) {
          // attempt to update any items list if present in this component
        }
        alert(`Request ${action}d.`);
      } else {
        alert(res.message || "Action failed");
      }
    } catch (err) {
      console.error("Action error:", err);
      alert("Server error while performing action");
    } finally {
      setProcessingRequests(p => p.filter(x => x !== id));
    }
  };

  return (
    <>
      <Navbar />

      <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "30px" }}>
  <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ color: "#00ffff", margin: 0, textAlign: "center" }}>👩‍🏫 Teacher Dashboard</h2>
            <p style={{ color: "#999", marginTop: "6px", textAlign: "center" }}>Manage your subjects and student requests</p>
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
              onClick={() => { setView("requests"); loadRequests(); }}
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
          </div>
        </header>

        {/* ---------- Subjects view ---------- */}
        {view === "subjects" && (
          <section>
            <h3 style={{ color: "#ccc" }}>Your Subjects</h3>
            {loadingSubjects ? (
              <p style={{ color: "#888" }}>Loading subjects...</p>
            ) : subjects.length === 0 ? (
              <p style={{ color: "#888" }}>No subjects found.</p>
            ) : (
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", marginTop: "18px" }}>
                {subjects.map((s) => (
                  <div key={s.subject_id} style={{ width: 260, background: "#111", padding: 16, borderRadius: 8, border: "1px solid #00ffff" }}>
                    <h4 style={{ margin: 0, color: "#fff" }}>{s.subject_name}</h4>
                    <p style={{ marginTop: 8, color: "#bbb" }}>{s.description || "No description"}</p>
                    {/* If you want link to labs: */}
                    {/* <Link to={`/subjects/${s.subject_id}`} style={{ color: "#00ffff" }}>View Labs →</Link> */}
                  </div>
                ))}
              </div>
            )}

            {/* Add Subject & Item forms for teacher */}
            <div style={{ marginTop: 20, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-start' }}>
              <div style={{ width: 320, background: '#111', padding: 12, borderRadius: 8, border: '1px solid #00ffff' }}>
                <h4 style={{ color: '#00ffff', textAlign: 'center' }}>Add Subject</h4>
                <input placeholder="Subject name" value={subjectForm.subject_name} onChange={e => setSubjectForm(prev => ({ ...prev, subject_name: e.target.value }))} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, background: '#000', color: '#fff', border: '1px solid #333' }} />
                <input placeholder="Subject ID (optional)" value={subjectForm.subject_id || ''} onChange={e => setSubjectForm(prev => ({ ...prev, subject_id: e.target.value }))} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, background: '#000', color: '#fff', border: '1px solid #333' }} />
                <textarea placeholder="Description (optional)" value={subjectForm.description} onChange={e => setSubjectForm(prev => ({ ...prev, description: e.target.value }))} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, background: '#000', color: '#fff', border: '1px solid #333', minHeight: 60 }} />
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={async () => {
                    const token = localStorage.getItem('token'); if (!token) return navigate('/login');
                    if (!subjectForm.subject_name) return alert('Please enter a subject name');
                    setAddingSubject(true);
                    const genCode = subjectForm.subject_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
                    const payload = { subject_name: subjectForm.subject_name, subject_code: genCode, description: subjectForm.description };
                    if (subjectForm.subject_id) payload.subject_id = subjectForm.subject_id;
                    const res = await addSubject(payload, token);
                    setAddingSubject(false);
                    if (res.success) {
                      alert('Subject added');
                      const r = await getSubjects(token);
                      if (r && (r.subjects || r.data)) setSubjects(r.subjects || r.data);
                      setSubjectForm({ subject_id: '', subject_name: '', description: '' });
                    } else alert(res.message || 'Failed to add subject');
                  }} style={{ background: '#00ffff', color: '#000', padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{addingSubject ? 'Adding...' : 'Add Subject'}</button>
                </div>
              </div>

              {/* Add Lab */}
              <div style={{ width: 320, background: '#111', padding: 12, borderRadius: 8, border: '1px solid #00ffff' }}>
                <h4 style={{ color: '#00ffff', textAlign: 'center' }}>Add Lab</h4>
                <select value={labForm.subject_id} onChange={e => setLabForm(prev => ({ ...prev, subject_id: e.target.value }))} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, background: '#000', color: '#fff', border: '1px solid #333' }}>
                  <option value=''>-- Select subject --</option>
                  {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                </select>
                <input placeholder='Lab name' value={labForm.lab_name} onChange={e => setLabForm(prev => ({ ...prev, lab_name: e.target.value }))} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, background: '#000', color: '#fff', border: '1px solid #333' }} />
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={async () => {
                    const token = localStorage.getItem('token'); if (!token) return navigate('/login');
                    if (!labForm.subject_id || !labForm.lab_name) return alert('Please select subject and enter lab name');
                    const res = await addLab({ subject_id: labForm.subject_id, lab_name: labForm.lab_name }, token);
                    if (res.success) {
                      alert('Lab added');
                      setLabForm({ subject_id: '', lab_name: '' });
                    } else alert(res.message || 'Failed to add lab');
                  }} style={{ background: '#00ffff', color: '#000', padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Add Lab</button>
                </div>
              </div>

              <div style={{ width: 420, background: '#111', padding: 12, borderRadius: 8, border: '1px solid #00ffff' }}>
                <h4 style={{ color: '#00ffff', textAlign: 'center' }}>Add Item</h4>
                <select value={itemForm.subject_id} onChange={async (e) => {
                  const subjId = e.target.value;
                  setItemForm(prev => ({ ...prev, subject_id: subjId }));
                  if (!subjId) return setLabsForSubject([]);
                  const token = localStorage.getItem('token');
                  const labsRes = await getLabsBySubject(subjId, token);
                  const labs = (labsRes && (labsRes.labs || labsRes.data)) || [];
                  setLabsForSubject(labs);
                }} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, background: '#000', color: '#fff', border: '1px solid #333' }}>
                  <option value="">-- Select subject --</option>
                  {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_id} — {s.subject_name}</option>)}
                </select>
                <select value={itemForm.lab_id || ''} onChange={e => setItemForm(prev => ({ ...prev, lab_id: e.target.value }))} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, background: '#000', color: '#fff', border: '1px solid #333' }}>
                  <option value=''>-- Select lab (optional) --</option>
                  {labsForSubject.map(l => <option key={l.lab_id || l.id} value={l.lab_id || l.id}>{l.lab_name || l.name}</option>)}
                </select>
                <input placeholder="Item name" value={itemForm.item_name} onChange={e => setItemForm(prev => ({ ...prev, item_name: e.target.value }))} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, background: '#000', color: '#fff', border: '1px solid #333' }} />
                <input placeholder="Quantity" type="number" value={itemForm.quantity} onChange={e => setItemForm(prev => ({ ...prev, quantity: e.target.value }))} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, background: '#000', color: '#fff', border: '1px solid #333' }} />
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={async () => {
                    const token = localStorage.getItem('token'); if (!token) return navigate('/login');
                    if (!itemForm.subject_id || !itemForm.item_name || !itemForm.quantity) return alert('Please fill all fields');
                    setAddingItem(true);
                    const payload = { item_name: itemForm.item_name, quantity: parseInt(itemForm.quantity) };
                    if (itemForm.subject_id) payload.subject_id = itemForm.subject_id;
                    if (itemForm.lab_id) payload.lab_id = itemForm.lab_id;
                    const res = await addItem(payload, token);
                    setAddingItem(false);
                    if (res.success) {
                      alert('Item added');
                      setItemForm({ subject_id: '', lab_id: '', item_name: '', quantity: '' });
                      setLabsForSubject([]);
                    } else alert(res.message || 'Failed to add item');
                  }} style={{ background: '#00ffff', color: '#000', padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{addingItem ? 'Adding...' : 'Add Item'}</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---------- Requests view (loads on button click) ---------- */}
        {view === "requests" && (
          <section style={{ marginTop: 10 }}>
            <h3 style={{ color: "#ccc" }}>Student Requests</h3>

            {loadingRequests ? (
              <p style={{ color: "#888" }}>Loading requests...</p>
            ) : requests.length === 0 ? (
              <p style={{ color: "#888" }}>No requests found.</p>
            ) : (
              <div style={{ marginTop: 18 }}>
                <table style={{ width: "95%", margin: "auto", borderCollapse: "collapse", background: "#111" }}>
                  <thead>
                    <tr style={{ background: "#00ffff11", color: "#00ffff" }}>
                      <th style={{ padding: 10, textAlign: "left" }}>Request ID</th>
                      <th style={{ padding: 10, textAlign: "left" }}>Student</th>
                      <th style={{ padding: 10, textAlign: "left" }}>Item</th>
                      <th style={{ padding: 10, textAlign: "left" }}>Quantity</th>
                      <th style={{ padding: 10, textAlign: "left" }}>Status</th>
                      <th style={{ padding: 10, textAlign: "left" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.request_id} style={{ borderBottom: "1px solid #00ffff22" }}>
                        <td style={{ padding: 10 }}>{r.request_id}</td>
                        <td style={{ padding: 10 }}>{r.student_name}</td>
                        <td style={{ padding: 10 }}>{r.item_name}</td>
                        <td style={{ padding: 10 }}>{r.quantity}</td>
                        <td style={{ padding: 10 }}>{r.status}</td>
                        <td style={{ padding: 10 }}>
                          {r.status === "pending" ? (
                            // only show buttons if teacher is allowed to process this request
                            (r.assigned_teacher_id ? r.assigned_teacher_id === currentUserId : true) ? (
                              <>
                                <button onClick={() => handleAction(r.request_id, "approve")} style={{ marginRight: 8, background: "#00ffff", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer", color: "#000" }} disabled={processingRequests.includes(r.request_id)}>
                                  {processingRequests.includes(r.request_id) ? 'Processing...' : 'Approve'}
                                </button>
                                <button onClick={() => handleAction(r.request_id, "deny")} style={{ background: "#ff5555", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer", color: "#fff" }} disabled={processingRequests.includes(r.request_id)}>
                                  {processingRequests.includes(r.request_id) ? 'Processing...' : 'Deny'}
                                </button>
                              </>
                            ) : (
                              <span style={{ color: "#999" }}>Not assigned to you</span>
                            )
                          ) : (
                            <span style={{ color: "#00ff99" }}>{r.status}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
