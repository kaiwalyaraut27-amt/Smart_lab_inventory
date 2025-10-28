import React, { useEffect, useState } from "react";
import { getItemsByLab } from "../api";
import { useParams, useNavigate } from "react-router-dom";

export default function ItemsPage() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    async function loadItems() {
      const res = await getItemsByLab(id, token);
      if (res.success && res.items) setItems(res.items);
    }
    loadItems();
  }, [id, navigate]);

  return (
    <div style={{ padding: "30px", background: "#000", color: "#fff", minHeight: "100vh" }}>
      <h2 style={{ color: "#00ffff", textAlign: "center" }}>🧰 Lab Items</h2>
      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <table style={{ width: "80%", margin: "auto", borderCollapse: "collapse", background: "#111" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #00ffff" }}>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.item_id} style={{ borderBottom: "1px solid #333" }}>
                <td>{item.item_name}</td>
                <td>{item.quantity}</td>
                <td>{new Date(item.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
