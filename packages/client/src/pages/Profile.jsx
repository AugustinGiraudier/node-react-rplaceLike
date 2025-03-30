import {useState, useEffect} from 'react';
import {Navigate} from 'react-router-dom';
import './Profile.css';

function Profile() {
	const [userData, setUserData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
		confirmPassword: ''
	});
	const [formError, setFormError] = useState('');
	const [success, setSuccess] = useState('');
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
			setFormData({
				username: parsedUser.username,
				email: parsedUser.email,
				password: '',
				confirmPassword: '',
		  		bio: parsedUser.bio
			});

			fetchUserContributions(parsedUser.id, token);
		} catch (err) {
			setError('Failed to load user data');
			console.error('Error parsing user data:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchUserContributions = async (userId, token) => {
		const { VITE_API_URL } = import.meta.env;

		try {
			const response = await fetch(`${VITE_API_URL}/stats/user/${userId}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) {
				throw new Error('Failed to fetch user contributions');
			}

			const data = await response.json();

			setContributions({
				totalPixels: data.totalPixelsPlaced,
				pixelBoards: data.boardsActivity.map(board => (console.log(board),
					{
					id: board.boardId,
					name: board.boardName,
					pixels: board.pixelsPlaced,
					lastContribution: new Date(board.lastActive).toISOString()
				}))
			});

		} catch (err) {
			console.error('Error fetching user contributions:', err);
		}
	};

	const handleInputChange = (e) => {
		const {name, value} = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const toggleEdit = () => {
		setIsEditing(!isEditing);
		setFormError('');
		setSuccess('');

		if (isEditing && userData) {
			setFormData({
				username: userData.username,
				email: userData.email,
				password: '',
				confirmPassword: '',
				bio: userData.bio
			});
		}
	};

	const validateForm = () => {
		if (formData.password && formData.password !== formData.confirmPassword) {
			setFormError("Passwords don't match");
			return false;
		}

		if (formData.password && formData.password.length < 6) {
			setFormError("Password must be at least 6 characters");
			return false;
		}

		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setFormError('');
		setSuccess('');

		if (!validateForm()) {
			return;
		}

		const token = localStorage.getItem('token');
		if (!token || !userData) {
			setFormError('Authentication required');
			return;
		}

		const updateData = {};
		if (formData.username && formData.username !== userData.username) updateData.username = formData.username;
		if (formData.email && formData.email !== userData.email) updateData.email = formData.email;
		if (formData.password) updateData.password = formData.password;
		if (formData.bio && formData.bio !== userData.bio) updateData.bio = formData.bio;

		if (Object.keys(updateData).length === 0) {
			setSuccess('No changes to save');
			setIsEditing(false);
			return;
		}

		try {
			const apiUrl = import.meta.env.VITE_API_URL || '';
			const response = await fetch(`${apiUrl}/user/${userData.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(updateData)
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to update profile');
			}

			const updatedUser = {
				...userData,
				...data.user
			};

			localStorage.setItem('user', JSON.stringify(updatedUser));
			setUserData(updatedUser);
			setFormData({
				username: updatedUser.username,
				email: updatedUser.email,
				password: '',
				confirmPassword: '',
				bio: updatedUser.bio
			});

			setSuccess('Profile updated successfully');
			setIsEditing(false);
		} catch (err) {
			setFormError(err.message || 'Error updating profile');
			console.error('Error updating profile:', err);
		}
	};

	if (!loading && !userData) {
		return <Navigate to="/login"/>;
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
						{!isEditing && (
							<button className="edit-profile-btn" onClick={toggleEdit}>
								Edit Profile
							</button>
						)}
					</div>

					{success && <div className="success-message">{success}</div>}
					{formError && <div className="error-message">{formError}</div>}

					<div className="profile-card">
						<h2>Account Information</h2>

						{isEditing ? (
							<form className="edit-form" onSubmit={handleSubmit}>
								<div className="form-group">
									<label htmlFor="username">Username:</label>
									<input
										type="text"
										id="username"
										name="username"
										value={formData.username}
										onChange={handleInputChange}
										required
									/>
								</div>

								<div className="form-group">
									<label htmlFor="email">Email:</label>
									<input
										type="email"
										id="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										required
									/>
								</div>

								<div className="form-group">
									<label htmlFor="password">New Password (leave blank to keep current):</label>
									<input
										type="password"
										id="password"
										name="password"
										value={formData.password}
										onChange={handleInputChange}
										placeholder="Leave blank to keep current password"
									/>
								</div>

								<div className="form-group">
									<label htmlFor="confirmPassword">Confirm New Password:</label>
									<input
										type="password"
										id="confirmPassword"
										name="confirmPassword"
										value={formData.confirmPassword}
										onChange={handleInputChange}
										placeholder="Confirm new password"
									/>
								</div>
								<div className="form-group">
									<label htmlFor="bio">Bio:</label>
									<input
										id="bio"
										name="bio"
										value={formData.bio}
										onChange={handleInputChange}
										placeholder="Tell us about yourself"
									/>
								</div>

								<div className="form-buttons">
									<button type="submit" className="save-btn">Save Changes</button>
									<button type="button" className="cancel-btn" onClick={toggleEdit}>Cancel</button>
								</div>
							</form>
						) : (
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
								<div className="info-item">
									<span className="info-label">Bio:</span>
									<span className="info-value">{userData.bio}</span>
								</div>
							</div>
						)}
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
											<span>Last active: {new Date(board.lastContribution).toLocaleString()}</span>
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
