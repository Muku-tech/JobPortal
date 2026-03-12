import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import '../styles/Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setOpenDropdown(null);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-icon">JS</span>
          <span className="logo-text">JobSathi</span>
        </Link>

        {/* Mobile Toggle */}
        <button 
          className={`menu-icon ${menuOpen ? "open" : ""}`} 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          {!user ? (
            <div className="auth-nav-group">
              <div className="nav-item dropdown">
                <button
                  className={`dropbtn ${openDropdown === "jobseeker" ? "active" : ""}`}
                  onClick={() => toggleDropdown("jobseeker")}
                >
                  Job Seeker <span className="arrow">▾</span>
                </button>
                <div className={`dropdown-content ${openDropdown === "jobseeker" ? "show" : ""}`}>
                  <Link to="/login?role=jobseeker" onClick={closeMenu}>Login</Link>
                  <Link to="/register?role=jobseeker" onClick={closeMenu}>Register</Link>
                </div>
              </div>

              <div className="nav-item dropdown">
                <button
                  className={`dropbtn ${openDropdown === "employer" ? "active" : ""}`}
                  onClick={() => toggleDropdown("employer")}
                >
                  Employer <span className="arrow">▾</span>
                </button>
                <div className={`dropdown-content ${openDropdown === "employer" ? "show" : ""}`}>
                  <Link to="/login?role=employer" onClick={closeMenu}>Login</Link>
                  <Link to="/register?role=employer" onClick={closeMenu}>Register</Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="user-nav-group">
              {user.role === "jobseeker" && (
                <>
                  <Link to="/jobs" className="nav-link" onClick={closeMenu}>Browse Jobs</Link>
                  <Link to="/dashboard" className="nav-link" onClick={closeMenu}>Dashboard</Link>
                </>
              )}

              {user.role === "employer" && (
                <>
                  <Link to="/employer" className="nav-link" onClick={closeMenu}>Overview</Link>
                  <Link to="/post-job" className="nav-link" onClick={closeMenu}>Post Job</Link>
                  <Link to="/employer/applications" className="nav-link" onClick={closeMenu}>Manage Applicants</Link>
                </>
              )}

              <Link to="/profile" className="nav-link profile-link" onClick={closeMenu}>
                My Profile
              </Link>

              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;