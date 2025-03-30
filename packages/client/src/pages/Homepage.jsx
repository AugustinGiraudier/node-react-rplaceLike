import {useState, useEffect} from 'react';
import './Homepage.css';
import BoardCard from '../components/BoardCard';

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
				if (!statsResponse.ok) {
					throw new Error(`Error fetching stats: ${statsResponse.status}`);
				}
				const statsData = await statsResponse.json();
				setStats(statsData);

				const boardsResponse = await fetch(`${VITE_API_URL}/boards`);
				if (!boardsResponse.ok) {
					throw new Error(`Error fetching boards: ${boardsResponse.status}`);
				}
				const boardsData = await boardsResponse.json();

				// Traiter tous les boards pour obtenir le temps restant
				const boardsWithTimeLeft = await Promise.all(
					boardsData.map(async (board) => {
						try {
							const timeResponse = await fetch(`${VITE_API_URL}/boards/timeleft`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({ boardId: board._id })
							});

							if (!timeResponse.ok) {
								return { ...board, timeLeft: "?" };
							}

							const timeData = await timeResponse.json();

							let timeLeftStr = "?";
							if (timeData.timeleft === "Infinite") {
								timeLeftStr = "∞";
							} else if (timeData.timeleft && typeof timeData.timeleft === 'object') {
								const { days, hours } = timeData.timeleft;

								if (days > 0) {
									timeLeftStr = `${days}d`;
								} else if (hours > 0) {
									timeLeftStr = `${hours}h`;
								} else {
									timeLeftStr = "<1h";
								}
							}

							return { ...board, timeLeft: timeLeftStr, status: timeData.status };
						} catch (err) {
							console.error(`Error fetching time for board ${board._id}:`, err);
							return { ...board, timeLeft: "?" };
						}
					})
				);

				const active = boardsWithTimeLeft.filter(board => board.status === 'active' || !board.status);
				const completed = boardsWithTimeLeft.filter(board => board.status === 'non-active');

				setActiveBoards(active);
				setCompletedBoards(completed);
			} catch (err) {
				console.error('Error fetching data:', err);
				setError('Failed to load data. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	return (
		<div className="homepage">
			<div className="hero-section">
				<h1>PixelBoard</h1>
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
						<h2>Active</h2>
						<div className="boards-grid">
							{activeBoards.length > 0 ? (
								activeBoards.map(board => (
									<BoardCard
										key={board._id}
										id={board._id}
										name={board.name}
										author={board.author?.username || "Unknown"}
										time={board.timeLeft}
									/>
								))
							) : (
								<p>No active PixelBoards at the moment.</p>
							)}
						</div>
					</section>

					<section className="boards-section">
						<h2>Completed</h2>
						<div className="boards-grid">
							{completedBoards.length > 0 ? (
								completedBoards.map(board => (
									<BoardCard
										key={board._id}
										id={board._id}
										name={board.name}
										author={board.author?.username || "Unknown"}
										time={"Completed"}
									/>
								))
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
