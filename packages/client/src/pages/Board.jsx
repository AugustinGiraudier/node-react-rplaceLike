import { useEffect, useState, useRef } from 'react';
import { useParams } from "react-router-dom";
import './Board.css';

const { VITE_API_URL } = import.meta.env;

const COLORS = [
	'#FFFFFF', '#E4E4E4', '#888888', '#222222', '#FFA7D1',
	'#E50000', '#E59500', '#A06A42', '#E5D900', '#94E044',
	'#02BE01', '#00D3DD', '#0083C7', '#0000EA', '#CF6EE4', '#820080'
];

function Board() {
	const { id } = useParams();
	const [board, setBoard] = useState(null);
	const [pixels, setPixels] = useState([]);
	const [selectedColor, setSelectedColor] = useState(COLORS[0]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [boardStatus, setBoardStatus] = useState('Ouvert');
	const [remainingTime, setRemainingTime] = useState(0);
	const [hoverInfo, setHoverInfo] = useState(null);
	const [pixelSize, setPixelSize] = useState(15);
	const [canvasSize, setCanvasSize] = useState(480);

	const canvasRef = useRef(null);
	const containerRef = useRef(null);
	const hoverTimerRef = useRef(null);
	const startTimeRef = useRef(null);

	const BOARD_SIZE = 32;
	const BOARD_DURATION = 3 * 60;

	useEffect(() => {
		const initializePixels = () => {
			const newPixels = Array(BOARD_SIZE).fill().map(() =>
				Array(BOARD_SIZE).fill().map(() => ({
					color: '#FFFFFF',
					lastModifiedBy: null,
					lastModifiedAt: null,
					cooldownUntil: null
				}))
			);
			setPixels(newPixels);
		};

		initializePixels();
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const boardResponse = await fetch(`${VITE_API_URL}/boards/${id}`);
				const boardData = await boardResponse.json();
				setBoard(boardData);

				if (boardData.pixels && boardData.pixels.length > 0) {
					setPixels(boardData.pixels);
				}

				if (boardData.endDate) {
					const endDate = new Date(boardData.endDate);
					const now = new Date();

					if (endDate <= now) {
						setBoardStatus('Fermé');
						setRemainingTime(0);
					} else {
						setBoardStatus('Ouvert');
						setRemainingTime(Math.floor((endDate - now) / 1000));
						startTimeRef.current = new Date();
					}
				} else {
					setBoardStatus('Ouvert');
					setRemainingTime(BOARD_DURATION);
					startTimeRef.current = new Date();
				}

				setLoading(false);
			} catch (err) {
				console.error('Error fetching data:', err);
				setError('Impossible de charger le pixel board. Veuillez réessayer plus tard.');
				setLoading(false);
			}
		};

		if (id) fetchData();
	}, [id]);

	useEffect(() => {
		const timer = setInterval(() => {
			if (boardStatus === 'Ouvert') {
				const newRemainingTime = Math.max(0, remainingTime - 1);
				setRemainingTime(newRemainingTime);

				if (newRemainingTime === 0) {
					setBoardStatus('Fermé');
				}
			}

			setPixels(prevPixels => {
				let updated = false;
				const newPixels = prevPixels.map(row =>
					row.map(pixel => {
						if (pixel.cooldownUntil && pixel.cooldownUntil <= new Date()) {
							updated = true;
							return { ...pixel, cooldownUntil: null };
						}
						return pixel;
					})
				);
				return updated ? newPixels : prevPixels;
			});

			if (hoverInfo && hoverInfo.cooldownUntil) {
				setHoverInfo(prevInfo => {
					if (prevInfo && prevInfo.cooldownUntil && prevInfo.cooldownUntil <= new Date()) {
						return { ...prevInfo, cooldownUntil: null };
					}
					return prevInfo;
				});
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [boardStatus, remainingTime]);

	useEffect(() => {
		if (!canvasRef.current || pixels.length === 0) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (let y = 0; y < pixels.length; y++) {
			for (let x = 0; x < pixels[y].length; x++) {
				const pixel = pixels[y][x];
				ctx.fillStyle = pixel.color || '#FFFFFF';
				ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

				ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
				ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

				if (pixel.cooldownUntil && pixel.cooldownUntil > new Date()) {
					ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
					ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
				}
			}
		}

		if (boardStatus === 'Fermé') {
			ctx.fillStyle = 'rgba(200, 200, 200, 0.1)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
	}, [pixels, boardStatus, pixelSize]);

	const handleCanvasMouseMove = (e) => {
		if (!canvasRef.current) return;

		if (hoverTimerRef.current) {
			clearTimeout(hoverTimerRef.current);
			hoverTimerRef.current = null;
		}

		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((e.clientX - rect.left) / pixelSize);
		const y = Math.floor((e.clientY - rect.top) / pixelSize);

		if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
			hoverTimerRef.current = setTimeout(() => {
				setHoverInfo({
					row: y,
					col: x,
					...pixels[y][x],
					x: e.clientX - rect.left,
					y: e.clientY - rect.top
				});
			}, 1000);
		}
	};

	const handleCanvasMouseLeave = () => {
		if (hoverTimerRef.current) {
			clearTimeout(hoverTimerRef.current);
			hoverTimerRef.current = null;
		}
		setHoverInfo(null);
	};

	const handleCanvasClick = (e) => {
		if (boardStatus === 'Fermé' || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((e.clientX - rect.left) / pixelSize);
		const y = Math.floor((e.clientY - rect.top) / pixelSize);

		if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
			placePixel(y, x);
		}
	};

	const placePixel = async (row, col) => {
		const pixel = pixels[row][col];

		if (pixel.cooldownUntil && pixel.cooldownUntil > new Date()) {
			return;
		}

		const token = localStorage.getItem('token');
		if (!token) {
			alert('Vous devez être connecté pour placer un pixel.');
			return;
		}

		const userData = JSON.parse(localStorage.getItem('user') || '{}');
		const username = userData.username || 'Utilisateur';

		const newPixels = [...pixels];
		const now = new Date();
		const cooldownUntil = new Date(now.getTime() + 2 * 60 * 1000);

		newPixels[row][col] = {
			color: selectedColor,
			lastModifiedBy: username,
			lastModifiedAt: now,
			cooldownUntil: cooldownUntil
		};

		setPixels(newPixels);

		if (hoverInfo && hoverInfo.row === row && hoverInfo.col === col) {
			setHoverInfo({
				...hoverInfo,
				color: selectedColor,
				lastModifiedBy: username,
				lastModifiedAt: now,
				cooldownUntil: cooldownUntil
			});
		}

		try {
			await fetch(`${VITE_API_URL}/boards/${id}/pixel`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					row,
					col,
					color: selectedColor
				})
			});
		} catch (err) {
			console.error('Error updating pixel:', err);
		}
	};

	const formatCooldownTime = (cooldownUntil) => {
		if (!cooldownUntil) return null;

		const now = new Date();
		if (cooldownUntil <= now) return null;

		const diffMs = cooldownUntil - now;
		const diffSec = Math.ceil(diffMs / 1000);

		if (diffSec < 60) {
			return `${diffSec}s`;
		} else {
			const minutes = Math.floor(diffSec / 60);
			const seconds = diffSec % 60;
			return `${minutes}m ${seconds}s`;
		}
	};

	const formatBoardTime = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	if (loading) return <div className="loading-container">Chargement du pixel board...</div>;
	if (error) return <div className="error-container">{error}</div>;

	return (
		<div className="board-container">
			<h1 className="board-title">{board ? board.name : 'Pixel Board'}</h1>

			<div className="board-info">
				{board && (
					<div className="board-details">
						<p>Créé par: <strong>{board.author?.username || 'Utilisateur inconnu'}</strong></p>
						<p>Taille: 32x32</p>
						<div className={`board-status ${boardStatus === 'Fermé' ? 'status-closed' : 'status-open'}`}>
							<p>Statut: <strong>{boardStatus}</strong></p>
							{boardStatus === 'Ouvert' ? (
								<p>Temps restant: <strong>{formatBoardTime(remainingTime)}</strong></p>
							) : (
								<p>Le pixel board est terminé</p>
							)}
						</div>
					</div>
				)}
			</div>

			<div className="color-palette">
				{COLORS.map((color, index) => (
					<div
						key={index}
						className={`color-option ${selectedColor === color ? 'selected' : ''} ${boardStatus === 'Fermé' ? 'disabled' : ''}`}
						style={{ backgroundColor: color }}
						onClick={() => boardStatus === 'Ouvert' && setSelectedColor(color)}
						title={`Couleur ${index + 1}`}
					/>
				))}
			</div>

			<div className="pixel-board-container" ref={containerRef}>
				<canvas
					ref={canvasRef}
					width={canvasSize}
					height={canvasSize}
					className={`pixel-board-canvas ${boardStatus === 'Fermé' ? 'board-closed' : ''}`}
					onClick={handleCanvasClick}
					onMouseMove={handleCanvasMouseMove}
					onMouseLeave={handleCanvasMouseLeave}
				/>

				{hoverInfo && (
					<div className="pixel-hover-info" style={{
						position: 'absolute',
						left: `${hoverInfo.col * pixelSize + 20}px`,
						top: `${hoverInfo.row * pixelSize - 60}px`
					}}>
						{hoverInfo.lastModifiedBy ? (
							<>
								<p>Placé par: <strong>{hoverInfo.lastModifiedBy}</strong></p>
								{boardStatus === 'Ouvert' && hoverInfo.cooldownUntil && hoverInfo.cooldownUntil > new Date() ? (
									<p>Temps restant: <strong>{formatCooldownTime(hoverInfo.cooldownUntil)}</strong></p>
								) : (
									boardStatus === 'Ouvert' ? <p>Disponible</p> : <p>Pixel board fermé</p>
								)}
							</>
						) : (
							<p>Pixel non modifié</p>
						)}
					</div>
				)}
			</div>

			<div className="board-instructions">
				<p>Cliquez sur une couleur dans la palette, puis sur un pixel du canvas pour le colorier.</p>
				<p>Survolez un pixel pendant 1 seconde pour voir qui l&#39;a modifié en dernier.</p>
				{boardStatus === 'Fermé' && (
					<p className="closed-message">Ce pixel board est maintenant fermé et ne peut plus être modifié.</p>
				)}
			</div>
		</div>
	);
}

export default Board;
