import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"

import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import EmployerHome from "./pages/EmployerHome"
import Jobs from "./pages/Jobs"
import JobDetails from "./pages/JobDetails"
import PostJob from "./pages/PostJob"
import Dashboard from "./pages/Dashboard"
import EmployerApplications from "./pages/EmployerApplications"
import Profile from "./pages/Profile"

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">

      <Navbar />

      <main className="main-content">

        <Routes>

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/" element={<Home />} />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute allowedRole="jobseeker">
                <Jobs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute allowedRole="jobseeker">
                <JobDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="jobseeker">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employer"
            element={
              <ProtectedRoute allowedRole="employer">
                <EmployerHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/post-job"
            element={
              <ProtectedRoute allowedRole="employer">
                <PostJob />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employer/applications"
            element={
              <ProtectedRoute allowedRole="employer">
                <EmployerApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

      </main>

    </div>
  )
}

export default App
