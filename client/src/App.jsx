import { Routes, Route, Navigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { useAuth } from "./context/AuthContext"

import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import EmployerDashboard from "./pages/EmployerDashboard"
import Jobs from "./pages/Jobs"
import JobDetails from "./pages/JobDetails"
import PostJob from "./pages/PostJob"
import Dashboard from "./pages/Dashboard"
import EmployerApplications from "./pages/EmployerApplications"
import ManageJobs from "./pages/ManageJobs"
import JobSeekerProfile from "./pages/JobSeekerProfile"
import EmployerProfile from "./pages/EmployerProfile"
import EmployerJobApplicants from "./pages/EmployerJobApplicants"



// 1. Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-spinner">Loading JobSathi...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />
  }

  return children
}

// 2. Profile Helper Component (To fix the Hook error)
function ProfileRedirect() {
  const { user } = useAuth();
  
  if (user?.role === 'jobseeker') {
    return <JobSeekerProfile />;
  }
  return <EmployerProfile />;
}

function App() {
  const { loading, user } = useAuth()


  if (loading) {
    return <div className="loading-spinner">Loading...</div>
  }

  return (
    <div className="app-container">
      <Navbar />
      
      <main className="main-content">

        <AnimatePresence mode="wait">
          <Routes key={window.location.pathname}>
            {/* Public/Private Routes */}
            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />


            {/* JobSeeker Specific Routes */}
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

            {/* Employer Specific Routes */}
            <Route
              path="/employer"
              element={
                <ProtectedRoute allowedRole="employer">
                  <EmployerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employer/manage-jobs"
              element={
                <ProtectedRoute allowedRole="employer">
                  <ManageJobs />
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
              path="/employer/jobs/:id/applicants"
              element={
                <ProtectedRoute allowedRole="employer">
                  <EmployerJobApplicants />
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

            {/* Dynamic Profile Route */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileRedirect />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>

      </main>
    </div>
  )
}

export default App
