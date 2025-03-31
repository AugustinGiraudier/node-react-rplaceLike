import {useState, useEffect} from 'react';
import {Navigate} from 'react-router-dom';
import PixelBoardModal from '../components/PixelBoardModal';
import './AdminDashboard.css';

const {VITE_API_URL} = import.meta.env;

function AdminDashboard() {
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [boards, setBoards] = useState([]);
	const [error, setError] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [currentBoard, setCurrentBoard] = useState(null);
	const [statusFilter, setStatusFilter] = useState('all');
	const [nameFilter, setNameFilter] = useState('');
	const [sizeFilter, setSizeFilter] = useState('all');
	const [endingDateFilter, setEndingDateFilter] = useState('all');
	const [showFilters, setShowFilters] = useState(false);

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
					author: userData.id
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create board');
			}

			const newBoard = await response.json();
			setBoards([...boards, newBoard]);
			setIsModalOpen(false);
			setError(null);
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

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update board');
			}

			const result = await response.json();

			// Update the local state with the updated board
			setBoards(boards.map(board =>
				board._id === currentBoard._id ? result.board : board
			));

			setIsModalOpen(false);
			setCurrentBoard(null);
			setError(null);
		} catch (err) {
			console.error('Error updating board:', err);
			setError(err.message);
		}
	};

	const handleDeleteBoard = async (boardId) => {
		if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
			return;
		}

		const token = localStorage.getItem('token');
		try {
			const response = await fetch(`${VITE_API_URL}/boards/${boardId}`, {
				method: 'DELETE',
				headers: {Authorization: `Bearer ${token}`},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete board');
			}

			setBoards(boards.filter(board => board._id !== boardId));
			setError(null);
		} catch (err) {
			console.error('Error deleting board:', err);
			setError(err.message);
		}
	};

	const handleStatusChange = async (boardId, newStatus) => {
		const token = localStorage.getItem('token');

		try {
			const response = await fetch(`${VITE_API_URL}/boards/${boardId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({status: newStatus})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update board status');
			}

			const result = await response.json();

			// Update the board in the local state
			setBoards(boards.map(board =>
				board._id === boardId ? result.board : board
			));

			setError(null);
		} catch (err) {
			console.error('Error updating board status:', err);
			setError(err.message);
		}
	};

	const openEditModal = (board) => {
		setCurrentBoard(board);
		setIsModalOpen(true);
	};

	// Apply all filters to boards
	const filteredBoards = boards.filter(board => {
		// Status filter
		if (statusFilter !== 'all' && board.status !== statusFilter) {
			return false;
		}

		// Name filter
		if (nameFilter && !board.name.toLowerCase().includes(nameFilter.toLowerCase())) {
			return false;
		}

		// Size filter
		if (sizeFilter !== 'all') {
			const boardSize = board.width * board.height;

			switch (sizeFilter) {
				case 'small': // Less than 65536 pixels (256x256)
					if (boardSize >= 65536) return false;
					break;
				case 'medium': // Between 65536 and 262144 pixels (512x512)
					if (boardSize < 65536 || boardSize >= 262144) return false;
					break;
				case 'large': // Greater than 262144 pixels
					if (boardSize < 262144) return false;
					break;
				default:
					break;
			}
		}

		// Ending date filter
		if (endingDateFilter !== 'all') {
			if (endingDateFilter === 'infinite' && board.endingDate) {
				return false;
			} else if (endingDateFilter === 'expiring') {
				// Check if board will expire in the next 7 days
				if (!board.endingDate) return false;

				const endDate = new Date(board.endingDate);
				const sevenDaysFromNow = new Date();
				sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

				if (endDate > sevenDaysFromNow) return false;
			}
		}

		return true;
	});

	if (isLoading) return <div className="loading-container">Loading...</div>;
	if (!isAdmin) return <Navigate to="/" replace/>;

	return (
		<div className="admin-dashboard">
			<h1>Admin Dashboard</h1>

			{error && (
				<div className="error-message">
					<p>{error}</p>
					<button onClick={() => setError(null)}>Dismiss</button>
				</div>
			)}

			<div className="admin-pixelboards">
				<div className="admin-actions">
					<button
						className="admin-action-button create-button"
						onClick={() => {
							setCurrentBoard(null);
							setIsModalOpen(true);
						}}
					>
						Create New Board
					</button>

					<div className="filter-controls">
						<button
							className={`filter-toggle-button ${showFilters ? 'active' : ''}`}
							onClick={() => setShowFilters(!showFilters)}
						>
							{showFilters ? 'Hide Filters' : 'Show Filters'}
						</button>
					</div>
				</div>

				{showFilters && (
					<div className="filters-container">
						<div className="filter-row">
							<div className="filter-group">
								<label htmlFor="name-filter">Name:</label>
								<input
									type="text"
									id="name-filter"
									placeholder="Filter by name"
									value={nameFilter}
									onChange={(e) => setNameFilter(e.target.value)}
								/>
							</div>

							<div className="filter-group">
								<label htmlFor="status-filter">Status:</label>
								<select
									id="status-filter"
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
								>
									<option value="all">All Statuses</option>
									<option value="creating">Creating</option>
									<option value="active">Active</option>
									<option value="non-active">Not-active</option>
									<option value="finished">Finished</option>
								</select>
							</div>
						</div>

						<div className="filter-row">
							<div className="filter-group">
								<label htmlFor="size-filter">Size:</label>
								<select
									id="size-filter"
									value={sizeFilter}
									onChange={(e) => setSizeFilter(e.target.value)}
								>
									<option value="all">All Sizes</option>
									<option value="small">Small (≤ 256x256)</option>
									<option value="medium">Medium (256x256 - 512x512)</option>
									<option value="large">Large (≥ 512x512)</option>
								</select>
							</div>

							<div className="filter-group">
								<label htmlFor="ending-date-filter">Duration:</label>
								<select
									id="ending-date-filter"
									value={endingDateFilter}
									onChange={(e) => setEndingDateFilter(e.target.value)}
								>
									<option value="all">All Durations</option>
									<option value="infinite">Infinite</option>
									<option value="expiring">Expiring Soon (7 days)</option>
								</select>
							</div>
						</div>

						<button
							className="clear-filters-button"
							onClick={() => {
								setNameFilter('');
								setStatusFilter('all');
								setSizeFilter('all');
								setEndingDateFilter('all');
							}}
						>
							Clear Filters
						</button>
					</div>
				)}

				<div className="table-stats">
					Showing {filteredBoards.length} of {boards.length} boards
					{(nameFilter || statusFilter !== 'all' || sizeFilter !== 'all' || endingDateFilter !== 'all') &&
						' (filtered)'}
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
						<th>Ending Date</th>
						<th>Actions</th>
					</tr>
					</thead>
					<tbody>
					{filteredBoards.length === 0 ? (
						<tr>
							<td colSpan="8" className="no-boards">No boards found</td>
						</tr>
					) : (
						filteredBoards.map(board => (
							<tr key={board._id} className={`status-${board.status}`}>
								<td>{board.name}</td>
								<td>{board.width}x{board.height}</td>
								<td>{board.chunkSize || 16}</td>
								<td>{board.placementDelay}ms</td>
								<td>
									{board.status !== 'finished' ? (
										<select
											value={board.status}
											onChange={(e) => handleStatusChange(board._id, e.target.value)}
											className={`status-select status-${board.status}`}
										>
											<option value="active">Active</option>
											<option value="non-active">Not-active</option>
										</select>
									) : (
										<span className="status-finished">Finished</span>
									)}
								</td>
								<td>{new Date(board.creationDate).toLocaleDateString()}</td>
								<td>
									{board.endingDate
										? new Date(board.endingDate).toLocaleDateString()
										: 'Infinite'}
								</td>
								<td className="action-buttons">
									<button
										className="admin-edit"
										onClick={() => openEditModal(board)}
										disabled={board.status === 'finished'}
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
						))
					)}
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
