import { useState, useEffect } from 'react';
import { Link, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import '../styles/Navigation.css';

import Homepage from './Homepage';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import AdminDashboard from './AdminDashboard';
import Boards from './Boards';
import Board from './Board';
import Heatmap from './Heatmap';

function Navigation({ toggleTheme, darkMode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);

      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setIsAdmin(userData?.role === 'admin');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [location]);

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
    <>
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
            {/* Always visible menu items */}
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

            {/* Logged-in user menu items */}
            {isLoggedIn && (
              <>
                <li>
                  <Link to="/profile" className={isActive('/profile')} onClick={closeMobileMenu}>
                    My Profile
                  </Link>
                </li>

                {/* Admin Panel - only visible to admins */}
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
                      window.location.href = '/';
                    }}
                  >
                    Log Out
                  </button>
                </li>
              </>
            )}

            {/* Login/Register for non-logged in users */}
            {!isLoggedIn && (
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

            {/* Theme toggle */}
            <li>
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Routes */}
      <main className="content">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin route with protection */}
          <Route
            path="/admin"
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />}
          />
			<Route path="/pixelboards" element={<Boards />} />
			<Route path="/pixelboards/:id" element={<Board />} />
      <Route path="/pixelboards/:id/heatmap" element={<Heatmap />} />
			{/* 404 Route */}
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <h2>404 - Page Not Found</h2>
              <p>The page you are looking for does not exist.</p>
              <Link to="/">Go Home</Link>
            </div>
          } />
        </Routes>
      </main>
    </>
  );
}

export default Navigation;
