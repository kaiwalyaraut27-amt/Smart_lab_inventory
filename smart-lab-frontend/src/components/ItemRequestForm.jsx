import React, { useEffect, useState } from "react";
import { getItemsBySubject, createRequest } from "../api";

export default function ItemRequestForm({ subjectId }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItems() {
      const token = localStorage.getItem("token");
      const res = await getItemsBySubject(subjectId, token);
      if (res.success && res.data) setItems(res.data);
      setLoading(false);
    }
    loadItems();
  }, [subjectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!selectedItem || !quantity) {
      alert("Please select item and enter quantity.");
      return;
    }

    const res = await createRequest(
      { item_id: selectedItem, quantity: parseInt(quantity) },
      token
    );

    if (res.success) {
      alert("✅ Request submitted successfully!");
      setQuantity("");
      setSelectedItem("");
    } else {
      alert("❌ Failed: " + res.message);
    }
  };

  if (loading) return <p style={{ color: "#888" }}>Loading items...</p>;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <select
        value={selectedItem}
        onChange={(e) => setSelectedItem(e.target.value)}
        style={{
          background: "#000",
          color: "#fff",
          border: "1px solid #00ffff",
          padding: "8px",
          borderRadius: "5px",
          width: "250px",
        }}
      >
        <option value="">Select Item</option>
        {items.map((item) => (
          <option key={item.item_id} value={item.item_id}>
            {item.item_name} (Stock: {item.quantity})
          </option>
        ))}
      </select>

      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Enter quantity"
        required
        style={{
          width: "250px",
          padding: "8px",
          border: "1px solid #00ffff",
          borderRadius: "5px",
          background: "#000",
          color: "#fff",
        }}
      />

      <button
        type="submit"
        style={{
          background: "#00ffff",
          color: "#000",
          padding: "8px 16px",
          borderRadius: "5px",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Submit Request
      </button>
    </form>
  );
}
