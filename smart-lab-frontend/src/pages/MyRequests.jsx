import React, { useEffect, useState } from "react";
import { getMyRequests, returnItem } from "../api";
import { useNavigate } from "react-router-dom";

export function MyRequests() {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    async function loadRequests() {
      const res = await getMyRequests(token);
      if (res.success && res.data) setRequests(res.data);
    }
    loadRequests();
  }, [navigate]);

  const getColor = (status) => {
    switch (status) {
      case "approved": return "#00ffcc";
      case "denied": return "#ff5555";
      case "returned": return "#ffaa00";
      default: return "#cccccc";
    }
  };

  const handleReturn = async (requestId) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    const res = await returnItem(requestId, token);
    if (res.success) {
      // update local state
      setRequests(prev => prev.map(r => r.request_id === requestId ? { ...r, status: 'returned' } : r));
    } else {
      alert(res.message || 'Could not mark as returned');
    }
  };

  return (
    <div style={{ padding: "30px", color: "#fff", background: "#000", minHeight: "100vh" }}>
      <h2 style={{ color: "#00ffff", marginBottom: "20px", textAlign: "center" }}>📋 My Requests</h2>
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <table style={{ width: "80%", margin: "auto", borderCollapse: "collapse", background: "#111" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #00ffff" }}>
              <th>Item</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Requested On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.request_id} style={{ borderBottom: "1px solid #333" }}>
                <td>{r.item_name}</td>
                <td>{r.quantity}</td>
                <td style={{ color: getColor(r.status), fontWeight: "bold" }}>{r.status}</td>
                <td>{new Date(r.request_date).toLocaleString()}</td>
                <td>
                  {r.status === 'approved' && (
                    <button
                      onClick={() => handleReturn(r.request_id)}
                      style={{ background: '#ffaa00', color: '#000', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Return
                    </button>
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

export default MyRequests;
