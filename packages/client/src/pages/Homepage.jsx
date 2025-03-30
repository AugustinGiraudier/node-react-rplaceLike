import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import '../styles/Homepage.css';

const {VITE_API_URL} = import.meta.env;

function Homepage() {
	const [stats, setStats] = useState({
		userCount: 0,
		boardCount: 0
	});
	const [activeBoards, setActiveBoards] = useState([]);
	const [completedBoards, setCompletedBoards] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const statsResponse = await fetch(`${VITE_API_URL}/stats`);
				const statsData = await statsResponse.json();
				setStats(statsData);

				const activeBoardsResponse = await fetch(`${VITE_API_URL}/pixelboards/active`);
				const activeBoardsData = await activeBoardsResponse.json();
				setActiveBoards(activeBoardsData);

				const completedBoardsResponse = await fetch(`${VITE_API_URL}/pixelboards/completed`);
				const completedBoardsData = await completedBoardsResponse.json();
				setCompletedBoards(completedBoardsData);
			} catch (err) {
				console.error('Error fetching data:', err);
				setError('Failed to load data. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const renderBoardPreview = (board) => (
		<div className="board-preview" key={board._id}>
			<h4>{board.name}</h4>
			<div className="preview-image">
				<img src={board.previewUrl || '/placeholder-board.png'} alt={board.name}/>
			</div>
			<p>Size: {board.width}x{board.height}</p>
			<p>{board.status === 'active' ?
				`Ends: ${new Date(board.endDate).toLocaleDateString()}` :
				`Completed: ${new Date(board.endDate).toLocaleDateString()}`}
			</p>
			<Link to={`/pixelboard/${board._id}`} className="view-button">
				{board.status === 'active' ? 'Join Canvas' : 'View Artwork'}
			</Link>
		</div>
	);

	return (
		<div className="homepage">
			<div className="hero-section">
				<h1>PixelBoard</h1>
				<p className="tagline">Create collaborative pixel art, one pixel at a time</p>
			</div>

			<div className="stats-section">
				<div className="stat-card">
					<h3>{stats.userCount}</h3>
					<p>Registered Users</p>
				</div>
				<div className="stat-card">
					<h3>{stats.boardCount}</h3>
					<p>PixelBoards Created</p>
				</div>
			</div>

			{loading ? (
				<div className="loading">Loading PixelBoards...</div>
			) : error ? (
				<div className="error">{error}</div>
			) : (
				<>
					<section className="boards-section">
						<h2>Active PixelBoards</h2>
						<div className="boards-grid">
							{activeBoards.length > 0 ? (
								activeBoards.map(board => renderBoardPreview(board))
							) : (
								<p>No active PixelBoards at the moment.</p>
							)}
						</div>
					</section>

					<section className="boards-section">
						<h2>Completed Masterpieces</h2>
						<div className="boards-grid">
							{completedBoards.length > 0 ? (
								completedBoards.map(board => renderBoardPreview(board))
							) : (
								<p>No completed PixelBoards yet.</p>
							)}
						</div>
					</section>
				</>
			)}
		</div>
	);
}

export default Homepage;
