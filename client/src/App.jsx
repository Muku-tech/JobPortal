import { Routes, Route, Navigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { useAuth } from "./context/AuthContext"
import { ToastProvider } from "./context/ToastContext"

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
import ResumeBuilder from "./pages/ResumeBuilder"

// NEW IMPORT
import { useParams } from "react-router-dom"

// WRAPPER COMPONENT
function EmployerApplicationsWrapper() {
  const { jobId } = useParams()
  return <EmployerApplications jobId={jobId} />
}

// Protected Route Component
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

// Profile Helper Component
function ProfileRedirect() {
  const { user } = useAuth()
  
  if (user?.role === 'jobseeker') {
    return <JobSeekerProfile />
  }
  return <EmployerProfile />
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return <div className="loading-spinner">Loading...</div>
  }

  return (
    <div className="app-container">
      <Navbar />
      
      <ToastProvider>
        <main className="main-content">

          <AnimatePresence mode="wait">
            <Routes key={window.location.pathname}>

              {/* PUBLIC */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* JOB SEEKER */}
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

              {/* EMPLOYER */}
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

              {/* FIXED ROUTE */}
              <Route
                path="/employer/applications/:jobId"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerApplicationsWrapper />
                  </ProtectedRoute>
                }
              />

              {/* ALL APPLICATIONS */}
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

              {/* PROFILE */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileRedirect />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-builder"
                element={
                  <ProtectedRoute allowedRole="jobseeker">
                    <ResumeBuilder />
                  </ProtectedRoute>
                }
              />

              {/* FALLBACK */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </AnimatePresence>

        </main>
      </ToastProvider>
    </div>
  )
}

export default App

