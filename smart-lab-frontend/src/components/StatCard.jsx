// ✅ src/components/StatCard.jsx
import React from "react";

export function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "#111",
        padding: "20px",
        borderRadius: "10px",
        minWidth: "180px",
        boxShadow: "0 0 10px #00ffff55",
        textAlign: "center",
      }}
    >
      <h3 style={{ color: "#00ffff", marginBottom: "10px" }}>{title}</h3>
      <h1 style={{ fontSize: "2rem", margin: 0 }}>{value}</h1>
    </div>
  );
}

export default StatCard;

