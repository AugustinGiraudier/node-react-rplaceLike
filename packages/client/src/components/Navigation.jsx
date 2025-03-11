import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);

      // Check if user is admin
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setIsAdmin(userData?.role === 'admin');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="logo" onClick={closeMobileMenu}>
          PixelBoard
        </Link>

        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" className={isActive('/')} onClick={closeMobileMenu}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/pixelboards" className={isActive('/pixelboards')} onClick={closeMobileMenu}>
              PixelBoards
            </Link>
          </li>

          {isLoggedIn ? (
            <>
              <li>
                <Link to="/profile" className={isActive('/profile')} onClick={closeMobileMenu}>
                  My Profile
                </Link>
              </li>

              {isAdmin && (
                <li>
                  <Link to="/admin" className={isActive('/admin')} onClick={closeMobileMenu}>
                    Admin Panel
                  </Link>
                </li>
              )}

              <li>
                <button
                  className="logout-button"
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setIsLoggedIn(false);
                    setIsAdmin(false);
                    closeMobileMenu();
                    // Redirect to home if needed
                    window.location.href = '/';
                  }}
                >
                  Log Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className={isActive('/login')} onClick={closeMobileMenu}>
                  Log In
                </Link>
              </li>
              <li>
                <Link to="/register" className="register-link" onClick={closeMobileMenu}>
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
