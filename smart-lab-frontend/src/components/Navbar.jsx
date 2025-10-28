import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  // 🔹 Read token
  const token = localStorage.getItem("token");

  // 🔹 Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // 🔹 If user is not logged in, show only login/signup
  if (!token) {
    return (
      <nav
        style={{
          background: "#111",
          color: "#00ffff",
          padding: "15px 30px",
          borderBottom: "1px solid #00ffff44",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#00ffff",
            cursor: "pointer",
            fontWeight: "bold",
            textAlign: "center",
            flex: 1,
          }}
          onClick={() => navigate("/")}
        >
          DYPIU SMART LAB MANAGEMENT SYSTEM
        </h3>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link style={linkStyle} to="/login">
            Login
          </Link>
          <Link style={linkStyle} to="/signup">
            Signup
          </Link>
        </div>
      </nav>
    );
  }

  // 🔹 Logged-in view: only heading (center) + Logout (right)
  return (
    <nav
      style={{
        background: "#111",
        color: "#00ffff",
        padding: "15px 30px",
        borderBottom: "1px solid #00ffff44",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* 🔹 Centered Heading */}
      <h3
        onClick={() => navigate("/dashboard")}
        style={{
          margin: 0,
          color: "#00ffff",
          cursor: "pointer",
          fontWeight: "bold",
          textAlign: "center",
          flex: 1,
        }}
      >
        DYPIU SMART LAB MANAGEMENT SYSTEM
      </h3>

      {/* 🔹 Logout on the right */}
      <button
        onClick={handleLogout}
        style={{
          background: "none",
          border: "1px solid #ff5555",
          color: "#ff5555",
          padding: "5px 10px",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Logout
      </button>
    </nav>
  );
}

// ✅ Shared link style
const linkStyle = {
  color: "#00ffff",
  textDecoration: "none",
  fontWeight: "bold",
};
