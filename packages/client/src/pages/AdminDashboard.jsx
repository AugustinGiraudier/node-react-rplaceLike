import {useState, useEffect} from 'react';
import {Navigate} from 'react-router-dom';
import '../styles/AdminDashboard.css';

const {VITE_API_URL} = import.meta.env;

function AdminDashboard() {
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('overview');
	const [stats, setStats] = useState({});
	const [users, setUsers] = useState([]);
	const [boards, setBoards] = useState([]);
	const [error, setError] = useState(null);

	useEffect(() => {
		const checkAdminStatus = async () => {
			const token = localStorage.getItem('token');
			const userData = JSON.parse(localStorage.getItem('user') || '{}');

			if (!token) {
				setIsAdmin(false);
				setIsLoading(false);
				return;
			}

			try {
				// Verify admin status with the API
				const response = await fetch(`${VITE_API_URL}/users/me`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!response.ok) throw new Error('Failed to verify admin status');

				const data = await response.json();
				setIsAdmin(data.role === 'admin');
			} catch (err) {
				console.error('Error checking admin status:', err);
				setIsAdmin(false);
			} finally {
				setIsLoading(false);
			}
		};

		checkAdminStatus();
	}, []);

	useEffect(() => {
		if (isAdmin) {
			fetchData();
		}
	}, [isAdmin, activeTab]);

	const fetchData = async () => {
		setError(null);
		const token = localStorage.getItem('token');

		try {
			if (activeTab === 'overview' || activeTab === 'stats') {
				const statsResponse = await fetch(`${VITE_API_URL}/admin/stats`, {
					headers: {Authorization: `Bearer ${token}`}
				});
				if (!statsResponse.ok) throw new Error('Failed to fetch stats');
				const statsData = await statsResponse.json();
				setStats(statsData);
			}

			if (activeTab === 'users') {
				const usersResponse = await fetch(`${VITE_API_URL}/admin/users`, {
					headers: {Authorization: `Bearer ${token}`}
				});
				if (!usersResponse.ok) throw new Error('Failed to fetch users');
				const usersData = await usersResponse.json();
				setUsers(usersData);
			}

			if (activeTab === 'pixelboards') {
				const boardsResponse = await fetch(`${VITE_API_URL}/admin/pixelboards`, {
					headers: {Authorization: `Bearer ${token}`}
				});
				if (!boardsResponse.ok) throw new Error('Failed to fetch boards');
				const boardsData = await boardsResponse.json();
				setBoards(boardsData);
			}
		} catch (err) {
			console.error('Error fetching data:', err);
			setError(err.message);
		}
	};

	if (isLoading) {
		return <div className="admin-loading">Verifying admin access...</div>;
	}

	if (!isAdmin) {
		return <Navigate to="/" replace/>;
	}

	return (
		<div className="admin-dashboard">
			<h1>Admin Dashboard</h1>

			<div className="admin-tabs">
				<button
					className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
					onClick={() => setActiveTab('overview')}
				>
					Overview
				</button>
				<button
					className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
					onClick={() => setActiveTab('users')}
				>
					Users
				</button>
				<button
					className={`admin-tab ${activeTab === 'pixelboards' ? 'active' : ''}`}
					onClick={() => setActiveTab('pixelboards')}
				>
					PixelBoards
				</button>
				<button
					className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
					onClick={() => setActiveTab('stats')}
				>
					Statistics
				</button>
			</div>

			{error && <div className="admin-error">{error}</div>}

			<div className="admin-content">
				{activeTab === 'overview' && (
					<div className="admin-overview">
						<div className="admin-stats-cards">
							<div className="admin-stat-card">
								<h3>{stats.totalUsers || 0}</h3>
								<p>Total Users</p>
							</div>
							<div className="admin-stat-card">
								<h3>{stats.activeUsers || 0}</h3>
								<p>Active Users (Last 7 Days)</p>
							</div>
							<div className="admin-stat-card">
								<h3>{stats.totalBoards || 0}</h3>
								<p>Total PixelBoards</p>
							</div>
							<div className="admin-stat-card">
								<h3>{stats.activeBoards || 0}</h3>
								<p>Active PixelBoards</p>
							</div>
						</div>

						<div className="admin-recent-activity">
							<h2>Recent Activity</h2>
							{/* Recent activity would be shown here */}
							<p>Display recent user activities and board updates here</p>
						</div>
					</div>
				)}

				{activeTab === 'users' && (
					<div className="admin-users">
						<h2>Manage Users</h2>
						<div className="admin-actions">
							<button className="admin-action-button">Create New User</button>
							<input
								type="text"
								placeholder="Search users..."
								className="admin-search"
							/>
						</div>

						<table className="admin-table">
							<thead>
							<tr>
								<th>Username</th>
								<th>Email</th>
								<th>Role</th>
								<th>Pixels Placed</th>
								<th>Created</th>
								<th>Actions</th>
							</tr>
							</thead>
							<tbody>
							{users.length > 0 ? (
								users.map(user => (
									<tr key={user._id}>
										<td>{user.username}</td>
										<td>{user.email}</td>
										<td>{user.role}</td>
										<td>{user.pixelsPlaced}</td>
										<td>{new Date(user.createdAt).toLocaleDateString()}</td>
										<td className="admin-actions-cell">
											<button className="admin-edit">Edit</button>
											<button className="admin-delete">Delete</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="6">No users found</td>
								</tr>
							)}
							</tbody>
						</table>
					</div>
				)}

				{activeTab === 'pixelboards' && (
					<div className="admin-pixelboards">
						<h2>Manage PixelBoards</h2>
						<div className="admin-actions">
							<button className="admin-action-button">Create New Board</button>
							<input
								type="text"
								placeholder="Search boards..."
								className="admin-search"
							/>
						</div>

						<table className="admin-table">
							<thead>
							<tr>
								<th>Name</th>
								<th>Status</th>
								<th>Size</th>
								<th>Created</th>
								<th>End Date</th>
								<th>Actions</th>
							</tr>
							</thead>
							<tbody>
							{boards.length > 0 ? (
								boards.map(board => (
									<tr key={board._id}>
										<td>{board.name}</td>
										<td>{board.status}</td>
										<td>{board.width}x{board.height}</td>
										<td>{new Date(board.createdAt).toLocaleDateString()}</td>
										<td>{new Date(board.endDate).toLocaleDateString()}</td>
										<td className="admin-actions-cell">
											<button className="admin-edit">Edit</button>
											<button className="admin-delete">Delete</button>
											<button className="admin-view">View</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="6">No boards found</td>
								</tr>
							)}
							</tbody>
						</table>
					</div>
				)}

				{activeTab === 'stats' && (
					<div className="admin-detailed-stats">
						<h2>Detailed Statistics</h2>
						<div className="stats-container">
							<div className="stats-card">
								<h3>User Statistics</h3>
								<ul>
									<li>Total Users: {stats.totalUsers || 0}</li>
									<li>New Users (Last 7 Days): {stats.newUsers || 0}</li>
									<li>Active Users (Last 7 Days): {stats.activeUsers || 0}</li>
									<li>Average Pixels Per User: {stats.avgPixelsPerUser || 0}</li>
								</ul>
							</div>

							<div className="stats-card">
								<h3>PixelBoard Statistics</h3>
								<ul>
									<li>Total Boards: {stats.totalBoards || 0}</li>
									<li>Active Boards: {stats.activeBoards || 0}</li>
									<li>Completed Boards: {stats.completedBoards || 0}</li>
									<li>Total Pixels Placed: {stats.totalPixelsPlaced || 0}</li>
								</ul>
							</div>
						</div>

						<div className="stats-graphs">
							<p>Graphs and charts would be displayed here</p>
							{/* Graphs would be implemented with a charting library */}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default AdminDashboard;
