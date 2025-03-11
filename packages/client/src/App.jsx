import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Navigation from './components/Navigation';
import Homepage from './components/Homepage';
// import Login from './components/Login';
// import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
// import PixelBoardPage from './components/PixelBoardPage';
// import ProfilePage from './components/ProfilePage';
// import NotFound from './components/NotFound';

const { VITE_API_URL } = import.meta.env;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token validity with the API
      fetch(`${VITE_API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Invalid token');
        })
        .then(userData => {
          setIsAuthenticated(true);
          setUser(userData);
          setIsAdmin(userData.role === 'admin');
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(() => {
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (loading) {
      return <div className="loading-container">Loading...</div>;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    if (adminOnly && !isAdmin) {
      return <Navigate to="/" />;
    }

    return children;
  };

  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/pixelboards" element={<PixelBoardPage />} />

            {/* Protected routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pixelboard/:id"
              element={
                <ProtectedRoute>
                  <PixelBoardPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} PixelBoard - Collaborative Pixel Art</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
