import React, { useEffect, useState } from "react";
import { getAllRequests, approveRequest, denyRequest, resetAllRequests } from "../api";
import { useNavigate } from "react-router-dom";

export function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [processingRequests, setProcessingRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    async function loadRequests() {
      const res = await getAllRequests(token);
      if (res.success && res.data) setRequests(res.data);
    }
    loadRequests();
  }, [navigate]);

  const handleAction = async (id, action) => {
    if (processingRequests.includes(id)) return;
    setProcessingRequests(p => [...p, id]);
    const token = localStorage.getItem("token");
    const api = action === "approve" ? approveRequest : denyRequest;
    try {
      const res = await api(id, token);
      if (res.success) {
        setRequests((prev) => prev.map(r => r.request_id === id ? { ...r, status: action === "approve" ? "approved" : "denied" } : r));
        if (res.item_id !== undefined && res.item_quantity !== undefined) {
          // nothing to update locally here (no items list), but could be used by parent if needed
        }
        alert(`Request ${action}d.`);
      }
    } catch (err) {
      console.error('Action error:', err);
      alert('Server error while performing action');
    } finally {
      setProcessingRequests(p => p.filter(x => x !== id));
    }
  };

  return (
    <div style={{ padding: "30px", background: "#000", color: "#fff", minHeight: "100vh" }}>
      <h2 style={{ color: "#00ffff", marginBottom: "20px", textAlign: "center" }}>🧾 All Requests (Admin)</h2>
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={async () => {
            if (!confirm('Reset all requests? This will mark all as returned and clear the requests table.')) return;
            const token = localStorage.getItem('token');
            const res = await resetAllRequests(token);
            if (res.success) setRequests([]);
            else alert(res.message || 'Failed to reset requests');
          }}
          style={{ background: '#ff5555', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}
        >
          Reset All Requests
        </button>
      </div>
      {requests.length === 0 ? (
        <p>No requests available.</p>
      ) : (
        <table style={{ width: "90%", margin: "auto", borderCollapse: "collapse", background: "#111" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #00ffff" }}>
              <th>Student</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.request_id} style={{ borderBottom: "1px solid #333" }}>
                <td>{r.student_name}</td>
                <td>{r.item_name}</td>
                <td>{r.quantity}</td>
                <td style={{ color: r.status === "approved" ? "#00ffcc" : r.status === "denied" ? "#ff5555" : "#cccccc" }}>
                  {r.status}
                </td>
                <td>
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleAction(r.request_id, "approve")}
                        style={{ marginRight: "10px", background: "#00ffcc", color: "#000", border: "none", padding: "5px 10px" }}
                        disabled={processingRequests.includes(r.request_id)}
                      >
                        {processingRequests.includes(r.request_id) ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(r.request_id, "deny")}
                        style={{ background: "#ff5555", color: "#000", border: "none", padding: "5px 10px" }}
                        disabled={processingRequests.includes(r.request_id)}
                      >
                        {processingRequests.includes(r.request_id) ? 'Processing...' : 'Deny'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminRequests;
