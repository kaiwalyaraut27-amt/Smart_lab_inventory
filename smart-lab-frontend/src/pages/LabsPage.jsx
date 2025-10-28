import React, { useEffect, useState } from "react";
import { getLabsBySubject } from "../api";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function LabsPage() {
  const { id } = useParams();
  const [labs, setLabs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    async function loadLabs() {
      const res = await getLabsBySubject(id, token);
      if (res.success && res.labs) setLabs(res.labs);
    }
    loadLabs();
  }, [id, navigate]);

  return (
    <div style={{ padding: "30px", color: "#fff", background: "#000", minHeight: "100vh" }}>
      <h2 style={{ color: "#00ffff", textAlign: "center" }}>🔬 Labs</h2>
      {labs.length === 0 ? (
        <p>No labs found.</p>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "20px" }}>
          {labs.map((lab) => (
            <div key={lab.lab_id} style={{ border: "1px solid #00ffff", padding: "15px", width: "250px", background: "#111" }}>
              <h3>{lab.lab_name}</h3>
              <Link to={`/labs/${lab.lab_id}/items`} style={{ color: "#00ffff" }}>
                View Items →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
