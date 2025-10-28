// ✅ src/pages/Signup.jsx
import React, { useState } from "react";
import { signupUser } from "../api";

export function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Signup] submitting', formData);
    const res = await signupUser(formData);
    console.log('[Signup] response', res);
    setMessage(res.message || (res.success ? "Signup successful!" : "Error signing up."));
  };

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#0a0a0a",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
          width: "350px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "#00e0ff",
            marginBottom: "20px",
            fontSize: "1.6rem",
            fontWeight: "600",
          }}
        >
          Create an account
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            required
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #00e0ff",
              background: "#111",
              color: "#fff",
              outline: "none",
            }}
          />

          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #00e0ff",
              background: "#111",
              color: "#fff",
              outline: "none",
            }}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #00e0ff",
              background: "#111",
              color: "#fff",
              outline: "none",
            }}
          />

          <select
            name="role"
            onChange={handleChange}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #00e0ff",
              background: "#111",
              color: "#fff",
              outline: "none",
            }}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            style={{
              background: "#00e0ff",
              color: "#000",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "0.3s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#00b8cc")}
            onMouseOut={(e) => (e.target.style.background = "#00e0ff")}
          >
            Sign Up
          </button>
        </form>

        <p style={{ marginTop: "15px", color: "#aaa" }}>
          Already have an account?{' '}
          <a
            href="/login"
            style={{ color: "#00e0ff", textDecoration: "none", fontWeight: "bold" }}
          >
            Login
          </a>
        </p>

        {message && (
          <p
            style={{
              marginTop: "10px",
              color: message.includes("success") ? "#00ff88" : "#ff4444",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Signup;
