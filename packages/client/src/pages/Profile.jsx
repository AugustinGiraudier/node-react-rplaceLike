import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import '../styles/Profile.css';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contributions, setContributions] = useState({
    totalPixels: 0,
    pixelBoards: []
  });

  useEffect(() => {
    const userFromStorage = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userFromStorage || !token) {
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(userFromStorage);
      setUserData(parsedUser);

      fetchUserContributions(parsedUser.id, token);
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error parsing user data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserContributions = async (userId, token) => {
    // const { VITE_API_URL } = import.meta.env;

    try {
      // Donne fictive - attendre que khelil ait finit d'implémenter la partie api
      // const response = await fetch(`${VITE_API_URL}/users/${userId}/contributions`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      setTimeout(() => {
        setContributions({
          totalPixels: 42,
          pixelBoards: [
            { id: '1', name: 'Board 1', pixels: 15, lastContribution: '2025-03-10' },
            { id: '2', name: 'Board 2', pixels: 27, lastContribution: '2025-03-12' }
          ]
        });
      }, 500);
    } catch (err) {
      console.error('Error fetching user contributions:', err);
    }
  };

  if (!loading && !userData) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="profile-container">
      {loading ? (
        <div className="loading">Loading profile data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="profile-header">
            <div className="profile-avatar">
              {userData.username ? userData.username.charAt(0).toUpperCase() : '?'}
            </div>
            <h1>My Profile</h1>
          </div>

          <div className="profile-card">
            <h2>Account Information</h2>
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Username:</span>
                <span className="info-value">{userData.username}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{userData.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Account ID:</span>
                <span className="info-value">{userData.id}</span>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h2>Your Contributions</h2>
            <div className="contribution-stats">
              <div className="stat-box">
                <h3>{contributions.totalPixels}</h3>
                <p>Total Pixels Placed</p>
              </div>
              <div className="stat-box">
                <h3>{contributions.pixelBoards.length}</h3>
                <p>PixelBoards Joined</p>
              </div>
            </div>

            <h3>Recent Activity</h3>
            {contributions.pixelBoards.length > 0 ? (
              <div className="contribution-list">
                {contributions.pixelBoards.map(board => (
                  <div className="contribution-item" key={board.id}>
                    <div className="contribution-name">{board.name}</div>
                    <div className="contribution-details">
                      <span>{board.pixels} pixels</span>
                      <span>Last active: {new Date(board.lastContribution).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-contributions">You haven't contributed to any PixelBoards yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
