import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboardFixed";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Dashboard from "./pages/Dashboard";
import LabsPage from "./pages/LabsPage";
import ItemsPage from "./pages/ItemsPage"; // ✅ ensure this file exists
import MyRequests from "./pages/MyRequests";
import AdminRequests from "./pages/AdminRequests";

export default function App() {
  // used to hide nav on dashboard/lab pages
  const location = useLocation();
  const hideNav = ["/dashboard", "/subjects/", "/labs/"].some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        textAlign: "center",
        paddingTop: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* 🔹 Header */}
      {!hideNav && (
        <>
          <h1 style={{ color: "#00ffff", marginBottom: "10px" }}>
            D Y Patil International University
          </h1>
          <h2 style={{ fontSize: "1.3rem", color: "#ccc", marginBottom: "30px" }}>
            Smart Lab Management System
          </h2>

          {/* 🔹 Navbar */}
          <nav style={{ marginBottom: "30px" }}>
            <Link
              to="/login"
              style={{
                color: "#00ffff",
                marginRight: "20px",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Login
            </Link>
            <Link
              to="/signup"
              style={{
                color: "#00ffff",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Signup
            </Link>
          </nav>
        </>
      )}

      {/* 🔹 Routes */}
      <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/dashboard/admin" element={<AdminDashboard />} />
  <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
  <Route path="/dashboard/student" element={<StudentDashboard />} />
  <Route path="/dashboard/student/requests" element={<MyRequests />} />
  <Route path="/dashboard/admin/requests" element={<AdminRequests />} />
  <Route path="/subjects/:id" element={<LabsPage />} />
      <Route path="/labs/:id" element={<ItemsPage />} />
      <Route path="/labs/:id/items" element={<ItemsPage />} />
</Routes>
    </div>
  );
}
