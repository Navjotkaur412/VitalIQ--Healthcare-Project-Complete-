import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Profile from "./pages/Profile";

import PatientDashboard from "./pages/patient/PatientDashboard";
import EnterReading from "./pages/patient/EnterReading";
import History from "./pages/patient/History";
import Appointments from "./pages/patient/Appointments";
import Medications from "./pages/patient/Medications";
import AIInsights from "./pages/patient/AIInsights";

import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import PatientList from "./pages/doctor/PatientList";
import PatientDetail from "./pages/doctor/PatientDetail";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import CreateDoctor from "./pages/admin/CreateDoctor";
import AuditLogs from "./pages/admin/AuditLogs";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: "Inter, sans-serif", fontSize: "14px" } }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Patient */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/readings"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <EnterReading />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/history"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <Appointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/medications"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <Medications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/ai-insights"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <AIInsights />
            </ProtectedRoute>
          }
        />

        {/* Doctor */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <PatientList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients/:id"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <PatientDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/doctors/new"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CreateDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Landing />} />
      </Routes>
    </>
  );
}

export default App;
