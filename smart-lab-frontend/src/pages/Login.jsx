// ✅ src/pages/Login.jsx
import React, { useState } from "react";
import { loginUser } from "../api";
import { useNavigate } from "react-router-dom";

export function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await loginUser(formData);
      // safeFetch always returns an object
      if (!res) return setMessage("No response from server");

      if (res.success) {
        // persist token and user info
        localStorage.setItem("token", res.token);
        localStorage.setItem("role", res.user.role);
        localStorage.setItem("name", res.user.name);

        // navigate within SPA
        if (res.user.role === "admin") navigate("/dashboard/admin");
        else if (res.user.role === "teacher") navigate("/dashboard/teacher");
        else navigate("/dashboard/student");
      } else {
        setMessage(res.message || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("Server error: could not reach backend");
    }
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
            marginBottom: "25px",
            fontSize: "1.8rem",
            fontWeight: "600",
          }}
        >
          Welcome Back
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
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
            Login
          </button>
        </form>

        <p style={{ marginTop: "15px", color: "#aaa" }}>
          Don’t have an account?{" "}
          <a
            href="/signup"
            style={{ color: "#00e0ff", textDecoration: "none", fontWeight: "bold" }}
          >
            Sign Up
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

export default Login;
