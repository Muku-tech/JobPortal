import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { Menu, X, ChevronDown, LogOut, User, Briefcase, LayoutDashboard, Bell, FileText, Users } from 'lucide-react';
import '../styles/Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
const response = await api.get('/messages/count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.log('Unread count fetch failed:', error);
    }
  }, [user]);

  const locationRef = useRef(location.pathname);

  // Close menu only on actual path change
  useEffect(() => {
    if (location.pathname !== locationRef.current) {
      setMenuOpen(false);
      setOpenDropdown(null);
      locationRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Poll unread count every 30s when logged in
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user, fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

const toggleDropdown = useCallback((name) => {
  setOpenDropdown(openDropdown === name ? null : name);
}, [openDropdown]);

  // Disabled click-outside temporarily - interferes with dropdown hover/show
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (openDropdown && !event.target.closest('.nav-dropdown')) {
  //       setOpenDropdown(null);
  //     }
  //   };
  //
  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, [openDropdown]);

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
              <Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}>
                Browse Jobs
              </Link>
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
                  <Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`} title="Browse Jobs">
                    <Briefcase size={18} />
                    Browse Jobs
                  </Link>
                  <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} title="Dashboard">
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>
                  <Link to="/messages" className={`nav-link ${location.pathname === '/messages' ? 'active' : ''}`} title={`${unreadCount} unread`}>
                    <div className="icon-container">
                      <Bell size={18} />
                      {unreadCount > 0 && <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                    </div>
                    Messages
                  </Link>
                  <Link to="/resume-builder" className={`nav-link ${location.pathname === '/resume-builder' ? 'active' : ''}`} title="Resume Builder">
                    <FileText size={18} />
                    Resume Builder
                  </Link>
                </>
              )}
              {user.role === "employer" && (
                <>
                  <Link to="/employer" className={`nav-link ${location.pathname === '/employer' ? 'active' : ''}`}>
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>
                  <Link to="/post-job" className={`nav-link ${location.pathname === '/post-job' ? 'active' : ''}`}>
                    <Briefcase size={18} />
                    Post Job
                  </Link>
                  <Link to="/employer/applications" className={`nav-link ${location.pathname === '/employer/applications' ? 'active' : ''}`} title="Applicants">
                    <Users size={18} />
                    Applicants
                  </Link>
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
