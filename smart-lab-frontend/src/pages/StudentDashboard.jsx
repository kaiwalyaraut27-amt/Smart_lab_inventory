import React, { useEffect, useState } from "react";
import {
  getSubjects,
  createRequest,
  getMyRequests,
  getLabsBySubject,
  getItemsByLab,
  returnItem,
} from "../api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";


export default function StudentDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({ item_id: "", quantity: "" });
  const navigate = useNavigate();

  // ✅ Load subjects + requests
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadData() {
      const subj = await getSubjects(token);
      if (subj.success && subj.subjects) setSubjects(subj.subjects);

      const reqs = await getMyRequests(token);
      if (reqs.success && reqs.data) setRequests(reqs.data);
    }

    loadData();
  }, [navigate]);

  // ✅ Load items when a subject is selected
  useEffect(() => {
    // delegate to reusable fetch function below
    if (!selectedSubject) {
      setItems([]);
      setItemsLoading(false);
      return;
    }

    fetchItemsForSubjectId(String(selectedSubject));
  }, [selectedSubject]);

  // when a specific lab is selected, load items for that lab only
  useEffect(() => {
    if (!selectedLab) return;
    fetchItemsForLabId(selectedLab);
  }, [selectedLab]);

  // Helper: fetch items for a subject (used from effects and onFocus)
  async function fetchItemsForSubjectId(subjectId) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setItemsLoading(true);
    try {
      const subjId = Number(subjectId);
      const labsRes = await getLabsBySubject(subjId, token);
      const labsRaw = (labsRes && (labsRes.labs || labsRes.data)) || [];

      let allItems = [];
  if (labsRaw.length > 0) {
        for (const lab of labsRaw) {
          const labId = lab.lab_id ?? lab.id ?? lab.labId ?? lab.labID ?? undefined;
          if (!labId) continue;
            const itemsRes = await getItemsByLab(labId, token);
          const itemsRaw = (itemsRes && (itemsRes.items || itemsRes.data)) || [];
          for (const it of itemsRaw) {
            allItems.push({
              item_id: it.item_id ?? it.id,
              item_name: it.item_name ?? it.name ?? "Item",
              quantity: it.quantity ?? 0,
              lab_name: lab.lab_name ?? "Lab",
            });
          }
        }
      }

  setItems(allItems);
      setLabs(labsRaw);
    } catch (err) {
      console.error("Error loading items for subject", err);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }

  // Helper: fetch items for a specific lab id
  async function fetchItemsForLabId(labId) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setItemsLoading(true);
    try {
      const itemsRes = await getItemsByLab(labId, token);
      const itemsRaw = (itemsRes && (itemsRes.items || itemsRes.data)) || [];
      const itemsForLab = itemsRaw.map((it) => ({
        item_id: it.item_id ?? it.id ?? it.itemId,
        item_name: it.item_name ?? it.name ?? it.itemName ?? "Item",
        quantity: it.quantity ?? it.qty ?? 0,
        lab_name: "",
      }));
      setItems(itemsForLab);
      setFormData((prev) => ({ ...prev, item_id: "" }));
    } catch (err) {
      console.error("Error loading items for lab", err);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }

  // ✅ Submit Item Request
  const handleRequest = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!formData.item_id) return alert("Please select an item");

    try {
      const res = await createRequest(
        { item_id: formData.item_id, quantity: parseInt(formData.quantity) },
        token
      );
      if (res && res.success) {
        alert("Request submitted successfully!");
        setFormData({ item_id: "", quantity: "" });
        const reqs = await getMyRequests(token);
        if (reqs.success && reqs.data) setRequests(reqs.data);
        // Refresh items to reflect updated server-side stock
        if (selectedLab) await fetchItemsForLabId(selectedLab);
        else if (selectedSubject) await fetchItemsForSubjectId(selectedSubject);
      } else {
        alert((res && res.message) || "Error creating request");
      }
    } catch (err) {
      console.error("createRequest error", err);
      alert("Server error while creating request");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // ✅ Return Item (approved request)
  const handleReturn = async (requestId) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    const res = await returnItem(requestId, token);
    if (res.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === requestId ? { ...r, status: "returned" } : r
        )
      );
      // refresh available items
      if (selectedLab) fetchItemsForLabId(selectedLab);
      else if (selectedSubject) fetchItemsForSubjectId(selectedSubject);
    } else {
      alert(res.message || "Could not mark as returned");
    }
  };

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>
      <Navbar />
      <header
        style={{
          borderBottom: "1px solid #00ffff",
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
  <h2 style={{ color: "#00ffff", textAlign: "center" }}>🎓 Student Dashboard</h2>
        <button
          onClick={handleLogout}
          style={{
            background: "none",
            border: "1px solid #ff5555",
            color: "#ff5555",
            padding: "6px 12px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </header>

      {/* Subjects */}
      <section style={{ textAlign: "center", marginTop: "30px" }}>
        <h3>Your Subjects</h3>
        {subjects.length === 0 ? (
          <p style={{ color: "#888" }}>No subjects found.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            {subjects.map((s) => (
              <div
                key={s.subject_id}
                onClick={() => setSelectedSubject(String(s.subject_id))}
                style={{
                  border: "1px solid #00ffff",
                  borderRadius: "10px",
                  padding: "15px",
                  width: "250px",
                  background:
                    String(selectedSubject) === String(s.subject_id)
                      ? "#00ffff22"
                      : "#111",
                  cursor: "pointer",
                }}
              >
                <h3>{s.subject_name}</h3>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Request Form */}
      {subjects.length > 0 && (
        <form
          onSubmit={handleRequest}
          style={{
            marginTop: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h3>Request an Item</h3>
          <select
            value={selectedSubject || ""}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedLab(null);
              setFormData(prev => ({ ...prev, item_id: '' }));
            }}
            required
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #00ffff",
              padding: "8px",
              borderRadius: "5px",
              marginBottom: "10px",
              width: "260px",
            }}
          >
            <option value="">-- Select subject --</option>
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </select>

          {/* Lab selector (optional) */}
          <select
            value={selectedLab || ''}
            onChange={(e) => setSelectedLab(e.target.value)}
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #00ffff",
              padding: "8px",
              borderRadius: "5px",
              marginBottom: "10px",
              width: "260px",
            }}
            disabled={!labs || labs.length === 0}
          >
            <option value="">{labs && labs.length ? '-- Select lab (optional) --' : '-- No labs available --'}</option>
            {labs.map((l) => (
              <option key={l.lab_id || l.id} value={l.lab_id || l.id}>{l.lab_name || l.name}</option>
            ))}
          </select>

          <select
            value={formData.item_id}
            onChange={(e) =>
              setFormData({ ...formData, item_id: e.target.value })
            }
            onFocus={() => {
              // Refresh authoritative server-side item quantities when the user opens the dropdown
              if (selectedLab) fetchItemsForLabId(selectedLab);
              else if (selectedSubject) fetchItemsForSubjectId(selectedSubject);
            }}
            required
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #00ffff",
              padding: "8px",
              borderRadius: "5px",
              marginBottom: "10px",
              width: "220px",
            }}
            disabled={!selectedSubject || items.length === 0}
          >
            <option value="">
              {itemsLoading
                ? "Loading items..."
                : "-- Select item by name --"}
            </option>
            {items.map((it) => {
              const qtyNum = Number(it.quantity);
              const displayQty = Number.isFinite(qtyNum)
                ? Math.max(0, qtyNum)
                : "N/A";
              return (
                <option key={it.item_id} value={it.item_id}>
                  {`${it.item_name} (${it.lab_name || "N/A"}) - Stock: ${displayQty}`}
                </option>
              );
            })}
          </select>

          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
            required
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #00ffff",
              padding: "8px",
              borderRadius: "5px",
              marginBottom: "10px",
              width: "200px",
            }}
          />

          <button
            type="submit"
            style={{
              background: "#00ffff",
              color: "#000",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Submit Request
          </button>
        </form>
      )}

      {/* My Requests */}
      <section style={{ marginTop: "50px", textAlign: "center" }}>
        <h3>My Requests</h3>
        {requests.length === 0 ? (
          <p style={{ color: "#888" }}>No requests found.</p>
        ) : (
          <table
            style={{
              width: "80%",
              margin: "auto",
              borderCollapse: "collapse",
              background: "#111",
            }}
          >
            <thead>
              <tr style={{ color: "#00ffff" }}>
                <th style={{ padding: "10px" }}>Request ID</th>
                <th style={{ padding: "10px" }}>Item</th>
                <th style={{ padding: "10px" }}>Quantity</th>
                <th style={{ padding: "10px" }}>Status</th>
                <th style={{ padding: "10px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.request_id}>
                  <td style={{ padding: "10px" }}>{r.request_id}</td>
                  <td style={{ padding: "10px" }}>{r.item_name}</td>
                  <td style={{ padding: "10px" }}>{r.quantity}</td>
                  <td
                    style={{
                      padding: "10px",
                      color:
                        r.status === "approved"
                          ? "#00ffcc"
                          : r.status === "denied"
                          ? "#ff5555"
                          : r.status === "returned"
                          ? "#ffaa00"
                          : "#cccccc",
                      fontWeight: "bold",
                    }}
                  >
                    {r.status}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {r.status === "approved" ? (
                      <button
                        onClick={() => handleReturn(r.request_id)}
                        style={{
                          background: "#ffaa00",
                          color: "#000",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Return
                      </button>
                    ) : (
                      <span style={{ color: "#888" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

