import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, LogOut, User, Briefcase, LayoutDashboard } from 'lucide-react';
import '../styles/Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen ] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <nav className="navbar-root">
      <div className="navbar-container">
        {/* LOGO SECTION */}
        <Link to={user?.role === 'employer' ? '/employer' : '/'} className="navbar-logo">
          <img src="/logo.png" alt="JobSathi Logo" className="logo-image" />
        </Link>

        {/* MOBILE TOGGLE */}
        <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* NAV LINKS */}
        <div className={`navbar-menu ${menuOpen ? "is-open" : ""}`}>
          {!user ? (
            <div className="auth-group">
              <div className="nav-dropdown">
                <button className="drop-trigger" onClick={() => toggleDropdown("seeker")}>
                  Job Seeker <ChevronDown size={16} className={openDropdown === "seeker" ? "rotate" : ""} />
                </button>
                <div className={`drop-menu ${openDropdown === "seeker" ? "show" : ""}`}>
                  <Link to="/login?role=jobseeker">Login</Link>
                  <Link to="/register?role=jobseeker">Register</Link>
                </div>
              </div>

              <div className="nav-dropdown">
                <button className="drop-trigger" onClick={() => toggleDropdown("employer")}>
                  Employer <ChevronDown size={16} className={openDropdown === "employer" ? "rotate" : ""} />
                </button>
                <div className={`drop-menu ${openDropdown === "employer" ? "show" : ""}`}>
                  <Link to="/login?role=employer">Login</Link>
                  <Link to="/register?role=employer">Register</Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="user-group">
{user.role === "jobseeker" && (
                <>
                  <Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}>
                    Browse Jobs
                  </Link>
                  <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/resume-builder" className={`nav-link ${location.pathname === '/resume-builder' ? 'active' : ''}`}>
                    Resume Builder
                  </Link>
                </>
              )}

              {user.role === "employer" && (
                <>
                  <Link to="/employer" className="nav-link">Overview</Link>
                  <Link to="/post-job" className="nav-link">Post Job</Link>
                  <Link to="/employer/applications" className="nav-link">Applicants</Link>
                </>
              )}

              <Link to="/profile" className="nav-link profile-pill">
                <User size={18} /> My Profile
              </Link>

              <button onClick={handleLogout} className="btn-nav-logout">
                <LogOut size={18} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
