import { useEffect, useState } from 'react';
import BoardCard from '../components/BoardCard';
import './Boards.css';

const { VITE_API_URL } = import.meta.env;

function Boards() {
	const [boards, setBoards] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);


	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const boardsResponse = await fetch(`${VITE_API_URL}/boards`);

				if (!boardsResponse.ok) {
					throw new Error(`Error fetching boards: ${boardsResponse.status}`);
				}

				const boardsData = await boardsResponse.json();

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
							console.log(`Time data for board ${board._id}:`, timeData);

							if (timeData.status === "finished") {
								timeLeftStr = "Completed";
							} else if (timeData.timeleft === "Infinite") {
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

				setBoards(boardsWithTimeLeft);
				setLoading(false);
			} catch (err) {
				console.error('Error fetching data:', err);
				setError(err.message);
				setLoading(false);
			}
		};

		fetchData();
	}, []);


	if (loading) {
		return (
			<div id="boards-container">
				<div className="loading-message">Loading boards...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div id="boards-container">
				<div className="error-message">Error: {error}</div>
			</div>
		);
	}

	return (
		<div id="boards-container">
			<div id="boards-list">
				{boards.length === 0 ? (
					<div className="no-boards-message">No boards available</div>
				) : (
					boards.map((board) => (
						<BoardCard
							key={`${board._id}`}
							name={board.name}
							author={board?.author?.username || "Unknown"}
							time={board.timeLeft}
							id={board._id}
						/>
					))
				)}
			</div>
		</div>
	);
}

export default Boards;
