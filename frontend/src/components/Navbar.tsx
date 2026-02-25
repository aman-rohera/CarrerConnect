import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : '');
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <Link to="/" className="nav-brand">
        <span className="nav-brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        </span>
        CareerConnect
      </Link>

      <div className={`nav-links${isMenuOpen ? ' open' : ''}`}>
        {isAuthenticated ? (
          <>
            <Link to="/jobs" className={isActive('/jobs')}>Jobs</Link>
            {user?.user_type === 'employer' ? (
              <>
                <Link to="/jobs/create" className={isActive('/jobs/create')}>Post a Job</Link>
                <Link to="/my-jobs" className={isActive('/my-jobs')}>My Posts</Link>
              </>
            ) : user?.user_type === 'admin' ? (
              <Link to="/admin">Admin Panel</Link>
            ) : (
              <Link to="/my-applications" className={isActive('/my-applications')}>My Applications</Link>
            )}
            <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
            <Link to="/profile/edit" className="nav-user">
              <span className="nav-avatar">{initial}</span>
              {user?.username}
            </Link>
            <button onClick={handleLogout} className="logout-btn">Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/jobs" className={isActive('/jobs')}>Browse Jobs</Link>
            <Link to="/login" className={isActive('/login')}>Sign In</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Join Now</Link>
          </>
        )}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="theme-toggle"
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Hamburger */}
      <button
        className="nav-hamburger"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span style={{ transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : '' }} />
        <span style={{ opacity: isMenuOpen ? 0 : 1 }} />
        <span style={{ transform: isMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : '' }} />
      </button>
    </nav>
  );
}

export default Navbar;
