import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload.role?.toLowerCase();

      if (role === "admin") navigate("/dashboard/admin");
      else if (role === "teacher") navigate("/dashboard/teacher");
      else navigate("/dashboard/student");
    } catch (err) {
      console.error("Invalid token", err);
      navigate("/login");
    }
  }, [navigate]);

  return <p style={{ textAlign: "center", marginTop: "40px" }}>Redirecting...</p>;
}

export default Dashboard;
