import React, { useState, useEffect } from "react";
import { createRequest, getLabsBySubject, getItemsByLab } from "../api";

export default function RequestItemForm({ subjectId }) {
  const [labs, setLabs] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedLab, setSelectedLab] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLabs() {
      const token = localStorage.getItem("token");
      const res = await getLabsBySubject(subjectId, token);
      if (res.success) setLabs(res.labs);
    }
    if (subjectId) loadLabs();
  }, [subjectId]);

  useEffect(() => {
    async function loadItems() {
      const token = localStorage.getItem("token");
      if (!selectedLab) return;
      const res = await getItemsByLab(selectedLab, token);
      if (res.success) setItems(res.items);
    }
    loadItems();
  }, [selectedLab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await createRequest({ item_id: selectedItem, quantity }, token);
    setMessage(res.message || (res.success ? "Request submitted!" : "Error submitting request."));
  };

  return (
    <div
      style={{
        border: "1px solid #00ffff",
        borderRadius: "10px",
        padding: "25px",
        marginTop: "20px",
        width: "400px",
        background: "#111",
        color: "#fff",
        boxShadow: "0 0 15px #00ffff44",
      }}
    >
      <h3 style={{ color: "#00ffff", marginBottom: "15px" }}>🧾 Request an Item</h3>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <label style={{ textAlign: "left" }}>Lab:</label>
        <select
          value={selectedLab}
          onChange={(e) => setSelectedLab(e.target.value)}
          required
          style={{
            padding: "8px",
            borderRadius: "5px",
            background: "#000",
            color: "#fff",
            border: "1px solid #00ffff",
          }}
        >
          <option value="">Select Lab</option>
          {labs.map((lab) => (
            <option key={lab.lab_id} value={lab.lab_id}>
              {lab.lab_name}
            </option>
          ))}
        </select>

        <label style={{ textAlign: "left" }}>Item:</label>
        <select
          value={selectedItem}
          onChange={(e) => setSelectedItem(e.target.value)}
          required
          style={{
            padding: "8px",
            borderRadius: "5px",
            background: "#000",
            color: "#fff",
            border: "1px solid #00ffff",
          }}
        >
          <option value="">Select Item</option>
          {items.map((item) => (
            <option key={item.item_id} value={item.item_id}>
              {item.item_name} ({item.quantity} available)
            </option>
          ))}
        </select>

        <label style={{ textAlign: "left" }}>Quantity:</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
          required
          style={{
            padding: "8px",
            borderRadius: "5px",
            background: "#000",
            color: "#fff",
            border: "1px solid #00ffff",
          }}
        />

        <button
          type="submit"
          style={{
            marginTop: "10px",
            background: "#00ffff",
            border: "none",
            padding: "10px",
            color: "#000",
            fontWeight: "bold",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Submit Request
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "10px", color: "#00ffff", fontWeight: "bold" }}>{message}</p>
      )}
    </div>
  );
}
