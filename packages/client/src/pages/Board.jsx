import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from "react-router-dom";
import { io } from 'socket.io-client';

import './Board.css';

const { VITE_API_URL } = import.meta.env;

const COLORS = [
	'#FFFFFF', '#E4E4E4', '#888888', '#222222', '#FFA7D1',
	'#E50000', '#E59500', '#A06A42', '#E5D900', '#94E044',
	'#02BE01', '#00D3DD', '#0083C7', '#0000EA', '#CF6EE4', '#820080'
];

function Board() {
	const { id } = useParams();
	const canvasRef = useRef(null);
	const socketRef = useRef(null);
	const [selectedColor, setSelectedColor] = useState(COLORS[1]); // Par défaut, on choisit le gris clair
	const [connectionStatus, setConnectionStatus] = useState('Disconnected');
	const [boardInfo, setBoardInfo] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [eventLog, setEventLog] = useState([]);
	const [userData, setUserData] = useState(null);


	const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
	const [isPanning, setIsPanning] = useState(false);
	const [panStartPosition, setPanStartPosition] = useState({ x: 0, y: 0 });

	const pixelSize = 12;

	const logEvent = useCallback((message) => {
		setEventLog(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString(), message }]);
	}, []);

	useEffect(() => {
		try {
			const userString = localStorage.getItem('user');
			if (userString) {
				const user = JSON.parse(userString);
				setUserData(user);
				logEvent(`Utilisateur ${user.username} connecté`);
			} else {
				logEvent("Aucun utilisateur connecté");
			}
		} catch (error) {
			console.error("Erreur lors de la récupération des données utilisateur:", error);
		}
	}, [logEvent]);

	useEffect(() => {
		const fetchBoardData = async () => {
			try {
				setIsLoading(true);
				const response = await fetch(`${VITE_API_URL}/boards/${id}`);
				if (!response.ok) {
					throw new Error(`Échec de la récupération du board: ${response.statusText}`);
				}
				const data = await response.json();
				setBoardInfo(data);
				logEvent(`Board '${data.name}' chargé (${data.width}x${data.height})`);
			} catch (error) {
				console.error('Erreur lors de la récupération des données:', error);
				logEvent(`Erreur: ${error.message}`);
			} finally {
				setIsLoading(false);
			}
		};

		fetchBoardData();

		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, [id, logEvent]);

	useEffect(() => {
		if (!boardInfo || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		canvas.width = boardInfo.width * pixelSize;
		canvas.height = boardInfo.height * pixelSize;

		ctx.fillStyle = COLORS[0];
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		socketRef.current = io(VITE_API_URL);
		const socket = socketRef.current;

		socket.on('connect', () => {
			setConnectionStatus('Connected');
			logEvent('Connecté au serveur');

			socket.emit('join-board', id);
		});

		socket.on('disconnect', () => {
			setConnectionStatus('Disconnected');
			logEvent('Déconnecté du serveur');
		});

		socket.on('message', (msg) => {
			logEvent(`Serveur: ${msg}`);
		});

		socket.on('pixel-update', (data) => {
			logEvent(`Pixel mis à jour en (${data.x},${data.y})`);
			drawPixel(data.x, data.y, data.color);
		});

		socket.on('board-data', (data) => {
			logEvent(`Données du board reçues: ${Object.keys(data.pixels).length} pixels`);
			console.log('Données du board reçues:', data);
			console.log('Région:', data.region);
			console.log('Nombre de pixels:', Object.keys(data.pixels).length);
			console.log('Échantillon de pixels:', Object.entries(data.pixels).slice(0, 5));
			updateCanvasFromData(data);
		});

		socket.on('connect_error', (err) => {
			logEvent(`Erreur de connexion: ${err.message}`);
			setConnectionStatus('Error');
		});

		socket.on('error', (err) => {
			logEvent(`Erreur serveur: ${err.message}`);
		});
	}, [boardInfo, id, logEvent]);


	const handleContextMenu = useCallback((event) => {
		event.preventDefault();
	}, []);

	const handleMouseDown = useCallback((event) => {
		if (event.button === 2) { // Clic droit
			event.preventDefault();
			setIsPanning(true);
			setPanStartPosition({
				x: event.clientX - viewPosition.x,
				y: event.clientY - viewPosition.y
			});
		}
	}, [viewPosition]);


	const handleMouseMove = useCallback((event) => {
		if (!isPanning || !boardInfo || !canvasRef.current) return;

		const newX = event.clientX - panStartPosition.x;
		const newY = event.clientY - panStartPosition.y;

		const canvasWidth = boardInfo.width * pixelSize;
		const canvasHeight = boardInfo.height * pixelSize;
		const containerRect = canvasRef.current.parentElement.getBoundingClientRect();

		const maxX = containerRect.width - 10;
		const maxY = containerRect.height - 10;
		const minX = -canvasWidth + 10;
		const minY = -canvasHeight + 10;

		const limitedX = Math.min(maxX, Math.max(minX, newX));
		const limitedY = Math.min(maxY, Math.max(minY, newY));

		setViewPosition({
			x: limitedX,
			y: limitedY
		});
	}, [isPanning, panStartPosition, boardInfo, pixelSize]);


	const handleMouseUp = useCallback((event) => {
		if (event.button === 2 && isPanning) {
			setIsPanning(false);
		}
	}, [isPanning]);

	const handleMouseLeave = useCallback(() => {
		if (isPanning) {
			setIsPanning(false);
		}
	}, [isPanning]);

	const drawPixel = useCallback((x, y, color) => {
		if (!canvasRef.current) return;

		const ctx = canvasRef.current.getContext('2d');
		ctx.fillStyle = color;


		const canvasX = x * pixelSize;
		const canvasY = y * pixelSize;

		console.log(`drawPixel - x: ${x}, y: ${y}, color: ${color}, canvasX: ${canvasX}, canvasY: ${canvasY}`);

		ctx.fillRect(canvasX, canvasY, pixelSize, pixelSize);
	}, [pixelSize]);


	const updateCanvasFromData = useCallback((data) => {
		if (!canvasRef.current) return;

		const ctx = canvasRef.current.getContext('2d');


		ctx.fillStyle = data.defaultColor || COLORS[0];
		const regionX = data.region?.x || 0;
		const regionY = data.region?.y || 0;
		const regionWidth = data.region?.width || boardInfo?.width || 0;
		const regionHeight = data.region?.height || boardInfo?.height || 0;

		console.log(`Dessin de la région: x=${regionX}, y=${regionY}, w=${regionWidth}, h=${regionHeight}`);

		ctx.fillRect(
			regionX * pixelSize,
			regionY * pixelSize,
			regionWidth * pixelSize,
			regionHeight * pixelSize
		);


		console.log('Dessin des pixels individuels...');
		let pixelsDrawn = 0;

		Object.entries(data.pixels || {}).forEach(([key, color]) => {
			const [x, y] = key.split('_').map(Number);
			drawPixel(x, y, color);
			pixelsDrawn++;


			if (pixelsDrawn <= 5) {
				console.log(`Pixel dessiné: x=${x}, y=${y}, couleur=${color}`);
			}
		});

		console.log(`Total de ${pixelsDrawn} pixels dessinés`);
	}, [boardInfo, drawPixel, pixelSize]);


	const handleCanvasClick = useCallback((event) => {
		if (!canvasRef.current || !socketRef.current || !boardInfo || event.button !== 0 || isPanning) return;

		if (!userData) {
			logEvent("Erreur: Vous devez être connecté pour placer un pixel");
			return;
		}

		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();

		const x = Math.floor((event.clientX - rect.left) / pixelSize);
		const y = Math.floor((event.clientY - rect.top) / pixelSize);

		console.log('Clic aux coordonnées canvas:', x, y);
		console.log('Avec viewPosition:', viewPosition.x, viewPosition.y);

		if (x < 0 || y < 0 || x >= boardInfo.width || y >= boardInfo.height) {
			console.log('Clic en dehors des limites du board');
			return;
		}

		logEvent(`Placement de pixel en (${x},${y}) avec la couleur ${selectedColor}`);


		if (!userData || !userData.id) {
			logEvent("Erreur: Vous devez être connecté pour placer un pixel");
			return;
		}

		socketRef.current.emit('place-pixel', {
			boardId: id,
			x: x,
			y: y,
			color: selectedColor,
			userId: userData.id
		});

		drawPixel(x, y, selectedColor);
	}, [boardInfo, drawPixel, id, pixelSize, selectedColor, logEvent, userData, viewPosition, isPanning]);


	if (isLoading) {
		return <div className="board-loading">Chargement du board...</div>;
	}

	if (!boardInfo) {
		return <div className="board-error">Board non trouvé</div>;
	}

	return (
		<div className="board-page">
			<div className="board-header">
				<h2 className="board-title">{boardInfo.name}</h2>
				<div className="board-status-container">
					<div className={`connection-status ${connectionStatus.toLowerCase()}`}>
						Statut: {connectionStatus}
					</div>
					{userData ? (
						<div className="user-status">
							Connecté en tant que: <strong>{userData.username}</strong>
						</div>
					) : (
						<div className="user-status warning">
							Non connecté (impossible de placer des pixels)
						</div>
					)}
				</div>
			</div>

			<div className="board-main">
				<div className="color-palette">
					{COLORS.map((color, index) => (
						<div
							key={index}
							className={`color-option ${selectedColor === color ? 'selected' : ''}`}
							style={{ backgroundColor: color }}
							onClick={() => setSelectedColor(color)}
							title={`Couleur ${index + 1}`}
						/>
					))}
				</div>

				<div className="canvas-container">
					<div className="zoom-info">
						Position: {Math.floor(-viewPosition.x / pixelSize)}, {Math.floor(-viewPosition.y / pixelSize)}
					</div>
					<canvas
						ref={canvasRef}
						className={`board-canvas ${isPanning ? 'panning' : ''}`}
						style={{
							transform: `translate(${viewPosition.x}px, ${viewPosition.y}px)`
						}}
						onClick={handleCanvasClick}
						onContextMenu={handleContextMenu}
						onMouseDown={handleMouseDown}
						onMouseMove={handleMouseMove}
						onMouseUp={handleMouseUp}
						onMouseLeave={handleMouseLeave}
					/>
				</div>

				<div className="board-info-panel">
					<div className="event-log">
						<h3>Journal d'événements</h3>
						<ul>
							{eventLog.map((event, index) => (
								<li key={index}>
									<span className="time">[{event.time}]</span> {event.message}
								</li>
							))}
						</ul>
					</div>

					<div className="board-details">
						<p>Dimensions: {boardInfo.width} x {boardInfo.height}</p>
						<p>Couleur sélectionnée: <span style={{ backgroundColor: selectedColor }} className="color-preview"></span></p>
						<p>Position: ({Math.floor(-viewPosition.x / pixelSize)}, {Math.floor(-viewPosition.y / pixelSize)})</p>
						<p>Mode: {isPanning ? 'Déplacement' : 'Placement de pixels'}</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Board;
