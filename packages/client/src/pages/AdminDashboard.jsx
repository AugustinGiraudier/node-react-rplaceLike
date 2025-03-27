import {useState, useEffect} from 'react';
import {Navigate} from 'react-router-dom';
import PixelBoardModal from '../components/PixelBoardModal';
import '../styles/AdminDashboard.css';

const {VITE_API_URL} = import.meta.env;

function AdminDashboard() {
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [boards, setBoards] = useState([]);
	const [error, setError] = useState(null);

	// New state for PixelBoard management
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [currentBoard, setCurrentBoard] = useState(null);

	useEffect(() => {
		const checkAdminStatus = async () => {
			const token = localStorage.getItem('token');
			const userData = JSON.parse(localStorage.getItem('user'));

			if (!token || userData?.role !== 'admin') {
				setIsAdmin(false);
				setIsLoading(false);
				return;
			}

			try {
				const response = await fetch(`${VITE_API_URL}/admin/check-access`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				setIsAdmin(response.ok);
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
			fetchBoards();
		}
	}, [isAdmin]);

	const fetchBoards = async () => {
		const token = localStorage.getItem('token');
		try {
			const boardsResponse = await fetch(`${VITE_API_URL}/boards`, {
				headers: {Authorization: `Bearer ${token}`}
			});

			if (!boardsResponse.ok) throw new Error('Failed to fetch boards');

			const boardsData = await boardsResponse.json();
			setBoards(boardsData);
		} catch (err) {
			console.error('Error fetching boards:', err);
			setError(err.message);
		}
	};

	const handleCreateBoard = async (boardData) => {
		const token = localStorage.getItem('token');
		const userData = JSON.parse(localStorage.getItem('user'));

		try {
			const response = await fetch(`${VITE_API_URL}/boards`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					...boardData,
					author: userData._id
				})
			});

			if (!response.ok) throw new Error('Failed to create board');

			const newBoard = await response.json();
			setBoards([...boards, newBoard]);
			setIsModalOpen(false);
		} catch (err) {
			console.error('Error creating board:', err);
			setError(err.message);
		}
	};

	const handleUpdateBoard = async (boardData) => {
		const token = localStorage.getItem('token');

		try {
			const response = await fetch(`${VITE_API_URL}/boards/${currentBoard._id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(boardData)
			});

			if (!response.ok) throw new Error('Failed to update board');

			const updatedBoard = await response.json();
			setBoards(boards.map(board =>
				board._id === updatedBoard._id ? updatedBoard : board
			));
			setIsModalOpen(false);
			setCurrentBoard(null);
		} catch (err) {
			console.error('Error updating board:', err);
			setError(err.message);
		}
	};

	const handleDeleteBoard = async (boardId) => {
		const token = localStorage.getItem('token');
		console.log('Deleting board:', boardId);
		try {
			const response = await fetch(`${VITE_API_URL}/boards/delete`, {
				method: 'DELETE',
				headers: {Authorization: `Bearer ${token}`},
				body: JSON.stringify({
					boardId: boardId
				})
			});

			if (!response.ok) throw new Error('Failed to delete board');

			setBoards(boards.filter(board => board._id !== boardId));
		} catch (err) {
			console.error('Error deleting board:', err);
			setError(err.message);
		}
	};

	const openEditModal = (board) => {
		setCurrentBoard(board);
		setIsModalOpen(true);
	};

	if (isLoading) return <div>Loading...</div>;
	if (!isAdmin) return <Navigate to="/" replace/>;

	return (
		<div className="admin-dashboard">
			<h1>Admin Dashboard</h1>

			<div className="admin-pixelboards">
				<div className="admin-actions">
					<button
						className="admin-action-button"
						onClick={() => {
							setCurrentBoard(null);
							setIsModalOpen(true);
						}}
					>
						Create New Board
					</button>
				</div>

				<table className="admin-table">
					<thead>
					<tr>
						<th>Name</th>
						<th>Size</th>
						<th>Chunk Size</th>
						<th>Placement Delay</th>
						<th>Status</th>
						<th>Created</th>
						<th>Actions</th>
					</tr>
					</thead>
					<tbody>
					{boards.map(board => (
						<tr key={board._id}>
							<td>{board.name}</td>
							<td>{board.width}x{board.height}</td>
							<td>{board.chunkSize || 16}</td>
							<td>{board.placementDelay}ms</td>
							<td>{board.status}</td>
							<td>{new Date(board.creationDate).toLocaleDateString()}</td>
							<td>
								<button
									className="admin-edit"
									onClick={() => openEditModal(board)}
								>
									Edit
								</button>
								<button
									className="admin-delete"
									onClick={() => handleDeleteBoard(board._id)}
								>
									Delete
								</button>
							</td>
						</tr>
					))}
					</tbody>
				</table>
			</div>

			<PixelBoardModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setCurrentBoard(null);
				}}
				onSubmit={currentBoard ? handleUpdateBoard : handleCreateBoard}
				initialBoard={currentBoard}
			/>
		</div>
	);
}

export default AdminDashboard;
