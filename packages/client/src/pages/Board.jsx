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
	const [userData, setUserData] = useState(null);
	const [initialDataLoaded, setInitialDataLoaded] = useState(false);

	// Modifications pour le zoom
	const [zoomLevel, setZoomLevel] = useState(1);
	const basePixelSize = 12; // Taille de base d'un pixel
	const pixelSize = basePixelSize * zoomLevel;

	// Min et max zoom
	const MIN_ZOOM = 0.2;
	const MAX_ZOOM = 2;  // Limité à 200%
	const ZOOM_STEP = 0.2;

	// États pour le déplacement (panning)
	const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
	const [isPanning, setIsPanning] = useState(false);
	const [panStartPosition, setPanStartPosition] = useState({ x: 0, y: 0 });

	// Référence pour stocker l'état actuel des pixels
	const pixelsStateRef = useRef({});

	// Référence pour stocker la dernière data reçue du serveur
	const lastBoardDataRef = useRef(null);

	// Fonctions pour gérer le zoom
	const handleZoomIn = useCallback(() => {
		setZoomLevel(prevZoom => {
			const newZoom = Math.min(prevZoom + ZOOM_STEP, MAX_ZOOM);
			return newZoom;
		});
	}, []);

	const handleZoomOut = useCallback(() => {
		setZoomLevel(prevZoom => {
			const newZoom = Math.max(prevZoom - ZOOM_STEP, MIN_ZOOM);
			return newZoom;
		});
	}, []);

	const handleResetZoom = useCallback(() => {
		setZoomLevel(1);
		setViewPosition({ x: 0, y: 0 });
	}, []);

	// Dessiner un pixel individuel - optimisé pour ne pas redessiner tout le canvas
	const drawPixel = useCallback((x, y, color) => {
		if (!canvasRef.current) return;

		// Stocker l'état du pixel
		const pixelKey = `${x}_${y}`;
		pixelsStateRef.current[pixelKey] = color;

		// Obtenir le contexte du canvas
		const ctx = canvasRef.current.getContext('2d');
		ctx.fillStyle = color;

		// Calculer la taille actuelle des pixels en fonction du zoom
		const currentPixelSize = basePixelSize * zoomLevel;

		// Coordonnées en pixels sur le canvas
		const canvasX = x * currentPixelSize;
		const canvasY = y * currentPixelSize;

		// Dessiner le pixel
		ctx.clearRect(canvasX, canvasY, currentPixelSize, currentPixelSize);
		ctx.fillRect(canvasX, canvasY, currentPixelSize, currentPixelSize);

		console.log(`Pixel dessiné: x=${x}, y=${y}, couleur=${color}, zoom=${zoomLevel}`);
	}, [zoomLevel, basePixelSize]);

	// Redessiner tout le canvas - seulement lors des changements de zoom
	const redrawCanvas = useCallback(() => {
		if (!canvasRef.current || !boardInfo) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		// Taille actuelle des pixels
		const currentPixelSize = basePixelSize * zoomLevel;

		// Définir les dimensions du canvas
		canvas.width = boardInfo.width * currentPixelSize;
		canvas.height = boardInfo.height * currentPixelSize;

		// Effacer le canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Remplir le fond (couleur par défaut)
		ctx.fillStyle = COLORS[0];
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		console.log(`Redessinage complet du canvas avec zoom=${zoomLevel}`);

		// Dessiner tous les pixels
		let pixelsDrawn = 0;
		Object.entries(pixelsStateRef.current).forEach(([key, color]) => {
			const [x, y] = key.split('_').map(Number);

			// Dessiner le pixel
			const canvasX = x * currentPixelSize;
			const canvasY = y * currentPixelSize;

			ctx.fillStyle = color;
			ctx.fillRect(canvasX, canvasY, currentPixelSize, currentPixelSize);
			pixelsDrawn++;
		});

		console.log(`Total de ${pixelsDrawn} pixels redessinés avec zoom=${zoomLevel}`);
	}, [boardInfo, zoomLevel, basePixelSize]);

	// Gestion du zoom avec la molette de la souris
	const handleWheel = useCallback((event) => {
		// Récupérer la position du curseur par rapport au canvas
		const rect = canvasRef.current.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		// Position du curseur sur le canvas réel (en tenant compte du zoom actuel)
		const canvasX = mouseX - viewPosition.x;
		const canvasY = mouseY - viewPosition.y;

		// Position du curseur en "unités de board"
		const boardX = canvasX / pixelSize;
		const boardY = canvasY / pixelSize;

		// Calcul du nouveau niveau de zoom
		const zoomChange = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
		const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + zoomChange));

		if (newZoom !== zoomLevel) {
			// Calculer les nouvelles coordonnées du point sous le curseur
			const newPixelSize = basePixelSize * newZoom;
			const newCanvasX = boardX * newPixelSize;
			const newCanvasY = boardY * newPixelSize;

			// Ajuster la position pour maintenir le point sous le curseur
			const newViewX = mouseX - newCanvasX;
			const newViewY = mouseY - newCanvasY;

			setZoomLevel(newZoom);
			setViewPosition({ x: newViewX, y: newViewY });

		}
	}, [zoomLevel, viewPosition, pixelSize, basePixelSize]);

	// Récupération des informations utilisateur
	useEffect(() => {
		try {
			const userString = localStorage.getItem('user');
			if (userString) {
				const user = JSON.parse(userString);
				setUserData(user);
			}
		} catch (error) {
			console.error("Erreur lors de la récupération des données utilisateur:", error);
		}
	}, []);

	// Récupération des informations du board
	useEffect(() => {
		const fetchBoardData = async () => {
			try {
				setIsLoading(true);
				const response = await fetch(`${VITE_API_URL}/boards/${id}`);
				if (!response.ok) {
					throw new Error(`Échec de la récupération du board: ${response.statusText}`);
				}
				const data = await response.json();
				console.log(data.timeBeforeEnd / 60 / 24);
				setBoardInfo(data);
			} catch (error) {
				console.error('Erreur lors de la récupération des données:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchBoardData();

		// Nettoyage à la déconnexion
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, [id]);

	// Initialisation de la connexion WebSocket une seule fois
	useEffect(() => {
		// Initialiser la connexion WebSocket
		socketRef.current = io(VITE_API_URL);
		const socket = socketRef.current;

		socket.on('connect', () => {
			setConnectionStatus('Connected');

			// Rejoindre le board spécifique
			socket.emit('join-board', id);
		});

		socket.on('disconnect', () => {
			setConnectionStatus('Disconnected');
		});

		socket.on('pixel-update', (data) => {

			// Mettre à jour l'état des pixels et dessiner uniquement le pixel modifié
			drawPixel(data.x, data.y, data.color);
		});

		socket.on('board-data', (data) => {
			console.log('Données du board reçues:', data);

			// Stocker les données pour les réutiliser lors des changements de zoom
			lastBoardDataRef.current = data;

			// Mettre à jour l'état des pixels
			Object.entries(data.pixels || {}).forEach(([key, color]) => {
				const [x, y] = key.split('_').map(Number);
				pixelsStateRef.current[key] = color;
			});

			// Redessiner tout le canvas après avoir reçu les données initiales
			setInitialDataLoaded(true);
			redrawCanvas();
		});

		socket.on('connect_error', () => {
			setConnectionStatus('Error');
		});

		return () => {
			socket.disconnect();
		};
	}, [id, drawPixel]);

	useEffect(() => {
		if (initialDataLoaded && boardInfo && canvasRef.current) {
			// Exécuter le redessinage après un court délai
			const timer = setTimeout(() => {
				redrawCanvas();
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [initialDataLoaded, boardInfo, redrawCanvas]);

	// Mise à jour du canvas UNIQUEMENT quand le zoom change
	useEffect(() => {
		if (!boardInfo || !canvasRef.current) return;

		// Redessiner le canvas avec le nouveau zoom
		redrawCanvas();

	}, [boardInfo, zoomLevel, redrawCanvas]); // Redessine seulement quand le zoom change

	// Empêcher l'ouverture du menu contextuel lors du clic droit
	const handleContextMenu = useCallback((event) => {
		event.preventDefault();
	}, []);

	// Gestionnaire pour le début du déplacement (clic droit)
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

	// Gestionnaire pour le déplacement de la souris pendant le panning
	const handleMouseMove = useCallback((event) => {
		if (!isPanning || !boardInfo || !canvasRef.current) return;

		// Calculer la nouvelle position
		const newX = event.clientX - panStartPosition.x;
		const newY = event.clientY - panStartPosition.y;

		// Calculer les limites pour ne pas dépasser les bords du board
		const canvasWidth = boardInfo.width * pixelSize;
		const canvasHeight = boardInfo.height * pixelSize;
		const containerRect = canvasRef.current.parentElement.getBoundingClientRect();

		// Limites de déplacement: on ne doit pas perdre le canvas hors vue
		const maxX = containerRect.width - 10; // Garder au moins 10px visible
		const maxY = containerRect.height - 10;
		const minX = -canvasWidth + 10;
		const minY = -canvasHeight + 10;

		// Appliquer les limites
		const limitedX = Math.min(maxX, Math.max(minX, newX));
		const limitedY = Math.min(maxY, Math.max(minY, newY));

		setViewPosition({
			x: limitedX,
			y: limitedY
		});
	}, [isPanning, panStartPosition, boardInfo, pixelSize]);

	// Gestionnaire pour la fin du déplacement
	const handleMouseUp = useCallback((event) => {
		if (event.button === 2 && isPanning) {
			setIsPanning(false);
		}
	}, [isPanning]);

	// Gestionnaire pour quitter la zone du canvas pendant le déplacement
	const handleMouseLeave = useCallback(() => {
		if (isPanning) {
			setIsPanning(false);
		}
	}, [isPanning]);

	// Gérer le clic sur le canvas pour placer un pixel
	const handleCanvasClick = useCallback((event) => {
		if (!canvasRef.current || !socketRef.current || !boardInfo || event.button !== 0 || isPanning) return;

		// Vérifier si l'utilisateur est connecté
		if (!userData) {
			return;
		}

		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();

		// Calculer la position du pixel cliqué en utilisant le niveau de zoom actuel
		const currentPixelSize = basePixelSize * zoomLevel;
		const x = Math.floor((event.clientX - rect.left) / currentPixelSize);
		const y = Math.floor((event.clientY - rect.top) / currentPixelSize);

		console.log('Clic aux coordonnées canvas:', x, y);
		console.log('Avec viewPosition:', viewPosition.x, viewPosition.y);
		console.log('Avec zoom:', zoomLevel);

		// Vérifier que les coordonnées sont dans les limites du canvas
		if (x < 0 || y < 0 || x >= boardInfo.width || y >= boardInfo.height) {
			console.log('Clic en dehors des limites du board');
			return;
		}

		// Vérifier si l'utilisateur est connecté
		if (!userData || !userData.id) {
			return;
		}

		// Émettre l'événement de placement de pixel avec l'ID utilisateur
		socketRef.current.emit('place-pixel', {
			boardId: id,
			x: x,
			y: y,
			color: selectedColor,
			userId: userData.id
		});

		// Feedback visuel immédiat (optimiste) - mise à jour d'un seul pixel
		drawPixel(x, y, selectedColor);
	}, [boardInfo, id, basePixelSize, zoomLevel, selectedColor, userData, viewPosition, isPanning, drawPixel]);

	// Rendu du composant
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

					<div className="zoom-controls">
						<button onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM}>-</button>
						<span>{Math.round(zoomLevel * 100)}%</span>
						<button onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM}>+</button>
						<button onClick={handleResetZoom}>Reset</button>
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
						onWheel={handleWheel}
					/>
				</div>
			</div>
		</div>
	);
}

export default Board;
