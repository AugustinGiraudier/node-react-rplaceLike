import { useEffect, useState, useRef, useCallback } from 'react';
import {Link, useParams} from "react-router-dom";
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


	const [zoomLevel, setZoomLevel] = useState(1);
	const basePixelSize = 12; // Taille de base d'un pixel


	const MIN_ZOOM = 0.2;
	const MAX_ZOOM = 2;  // Limité à 200%
	const ZOOM_STEP = 0.2;


	const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
	const [isPanning, setIsPanning] = useState(false);
	const [panStartPosition, setPanStartPosition] = useState({ x: 0, y: 0 });



	const [pixelTooltip, setPixelTooltip] = useState({
		visible: false,
		x: 0,
		y: 0,
		author: '',
		loading: false,
		mouseX: 0,
		mouseY: 0
	});


	const pixelsStateRef = useRef({});


	const lastBoardDataRef = useRef(null);

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


	const drawPixel = useCallback((x, y, color) => {
		if (!canvasRef.current) return;


		const pixelKey = `${x}_${y}`;
		pixelsStateRef.current[pixelKey] = color;


		const ctx = canvasRef.current.getContext('2d');
		ctx.fillStyle = color;

		const canvasX = x * basePixelSize;
		const canvasY = y * basePixelSize;

		// Dessiner le pixel
		ctx.clearRect(canvasX, canvasY, basePixelSize, basePixelSize);
		ctx.fillRect(canvasX, canvasY, basePixelSize, basePixelSize);

		console.log(`Pixel dessiné: x=${x}, y=${y}, couleur=${color}`);
	}, [basePixelSize]);


	const redrawCanvas = useCallback(() => {
		if (!canvasRef.current || !boardInfo) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');


		canvas.width = boardInfo.width * basePixelSize;
		canvas.height = boardInfo.height * basePixelSize;


		ctx.clearRect(0, 0, canvas.width, canvas.height);


		ctx.fillStyle = COLORS[0];
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		console.log(`Redessinage complet du canvas avec zoom=${zoomLevel}`);

		let pixelsDrawn = 0;
		Object.entries(pixelsStateRef.current).forEach(([key, color]) => {
			const [x, y] = key.split('_').map(Number);

			// Dessiner le pixel
			const canvasX = x * basePixelSize;
			const canvasY = y * basePixelSize;

			ctx.fillStyle = color;
			ctx.fillRect(canvasX, canvasY, basePixelSize, basePixelSize);
			pixelsDrawn++;
		});

		console.log(`Total de ${pixelsDrawn} pixels redessinés`);
	}, [boardInfo, zoomLevel]);

	const debounce = (func, delay) => {
		let debounceTimer;
		return function(...args) {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => func.apply(this, args), delay);
		};
	};
	const handleWheel = useCallback((event) => {
		event.preventDefault();

		const direction = event.deltaY > 0 ? -1 : 1;

		const ZOOM_FACTOR = 0.1;

		const newZoom = Math.max(
			MIN_ZOOM,
			Math.min(MAX_ZOOM, zoomLevel * (1 + direction * ZOOM_FACTOR))
		);

		if (newZoom === zoomLevel) return;

		const mouseX = event.clientX;
		const mouseY = event.clientY;

		const canvasRect = canvasRef.current.getBoundingClientRect();

		const mouseCanvasX = mouseX - canvasRect.left;
		const mouseCanvasY = mouseY - canvasRect.top;

		const newViewX = mouseX - canvasRect.left - (mouseCanvasX / zoomLevel * newZoom);
		const newViewY = mouseY - canvasRect.top - (mouseCanvasY / zoomLevel * newZoom);


		setZoomLevel(newZoom);
		setViewPosition({
			x: viewPosition.x + newViewX,
			y: viewPosition.y + newViewY
		});
	}, [zoomLevel, viewPosition]);
	const handleMouseHover = useCallback(
		debounce(async (event) => {
			// Si le zoom est inférieur à 150%, ne pas afficher le tooltip
			if (!canvasRef.current || !boardInfo || zoomLevel < 1.5) {
				setPixelTooltip(prev => ({ ...prev, visible: false }));
				return;
			}

			const canvas = canvasRef.current;
			const rect = canvas.getBoundingClientRect();

			// Calculate the position of the hovered pixel
			const currentPixelSize = basePixelSize * zoomLevel;
			const x = Math.floor((event.clientX - rect.left) / currentPixelSize);
			const y = Math.floor((event.clientY - rect.top) / currentPixelSize);

			// Check if the coordinates are within the canvas boundaries
			if (x < 0 || y < 0 || x >= boardInfo.width || y >= boardInfo.height) {
				setPixelTooltip(prev => ({ ...prev, visible: false }));
				return;
			}

			// Set loading state
			setPixelTooltip({
				visible: true,
				x: x,
				y: y,
				author: '',
				timestamp: '',
				loading: true,
				mouseX: event.clientX,
				mouseY: event.clientY
			});

			try {
				const response = await fetch(`${VITE_API_URL}/boards/lastpixel/${id}/${x}/${y}`, {
					method: 'GET',
				});

				if (!response.ok) {
					throw new Error('Failed to fetch pixel author');
				}

				const data = await response.json();
				setPixelTooltip(prev => ({
					...prev,
					author: data.userId ? data.userId.username : 'Unknown',
					timestamp: data.timestamp ? data.timestamp : 'Unknown',
					loading: false
				}));
			} catch {
				console.log("Nobody claimed this pixel");
			}
		}, 200),
		[boardInfo, id, basePixelSize, zoomLevel]
	);
	const handleCanvasMouseLeave = useCallback(() => {
		setPixelTooltip(prev => ({ ...prev, visible: false }));

		if (isPanning) {
			setIsPanning(false);
		}
	}, [isPanning]);
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


		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, [id]);

	useEffect(() => {

		socketRef.current = io(VITE_API_URL);
		const socket = socketRef.current;

		socket.on('connect', () => {
			setConnectionStatus('Connected');


			socket.emit('join-board', id);
		});

		socket.on('disconnect', () => {
			setConnectionStatus('Disconnected');
		});

		socket.on('pixel-update', (data) => {


			drawPixel(data.x, data.y, data.color);
		});

		socket.on('board-data', (data) => {
			console.log('Données du board reçues:', data);


			lastBoardDataRef.current = data;


			Object.entries(data.pixels || {}).forEach(([key, color]) => {
				pixelsStateRef.current[key] = color;
			});


			setInitialDataLoaded(true);
			redrawCanvas();
		});

		socket.on('connect_error', () => {
			setConnectionStatus('Error');
		});

		return () => {
			socket.disconnect();
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, drawPixel]);

	useEffect(() => {
		if (initialDataLoaded && boardInfo && canvasRef.current) {

			const timer = setTimeout(() => {
				redrawCanvas();
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [initialDataLoaded, boardInfo, redrawCanvas]);


	useEffect(() => {
		if (!boardInfo || !canvasRef.current) return;


		redrawCanvas();

	}, [boardInfo, zoomLevel, redrawCanvas]);


	useEffect(() => {
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = "auto";
		};
	}, []);


	const handleContextMenu = useCallback((event) => {
		event.preventDefault();
	}, []);


	const handleMouseDown = useCallback((event) => {
		if (event.button === 2) { // Clic droit
			event.preventDefault();
			setIsPanning(true);
			setPanStartPosition({
				x: event.clientX,
				y: event.clientY
			});
			document.body.style.cursor = 'grabbing';
		}
	}, []);

	const handleMouseMove = useCallback((event) => {
		if (!isPanning) return;


		const dx = event.clientX - panStartPosition.x;
		const dy = event.clientY - panStartPosition.y;


		setViewPosition({
			x: viewPosition.x + dx,
			y: viewPosition.y + dy
		});


		setPanStartPosition({
			x: event.clientX,
			y: event.clientY
		});
	}, [isPanning, panStartPosition, viewPosition]);


	const handleBoardReset = useCallback(() => {

		const containerRect = canvasRef.current?.parentElement.getBoundingClientRect();
		if (!containerRect || !boardInfo) return;


		const centerX = (containerRect.width - boardInfo.width * basePixelSize * zoomLevel) / 2;
		const centerY = (containerRect.height - boardInfo.height * basePixelSize * zoomLevel) / 2;

		setViewPosition({
			x: centerX > 0 ? centerX : 0,
			y: centerY > 0 ? centerY : 0
		});
	}, [boardInfo, basePixelSize, zoomLevel]);

	const handleMouseUp = useCallback((event) => {
		if (event.button === 2 && isPanning) {
			setIsPanning(false);
			document.body.style.cursor = 'auto';
		}
	}, [isPanning]);



	const handleCanvasClick = useCallback((event) => {
		if (!canvasRef.current || !socketRef.current || !boardInfo || event.button !== 0 || isPanning) return;


		if (!userData) {
			return;
		}

		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();


		const currentPixelSize = basePixelSize * zoomLevel;
		const x = Math.floor((event.clientX - rect.left) / currentPixelSize);
		const y = Math.floor((event.clientY - rect.top) / currentPixelSize);

		console.log('Clic aux coordonnées canvas:', x, y);
		console.log('Avec viewPosition:', viewPosition.x, viewPosition.y);
		console.log('Avec zoom:', zoomLevel);


		if (x < 0 || y < 0 || x >= boardInfo.width || y >= boardInfo.height) {
			console.log('Clic en dehors des limites du board');
			return;
		}


		if (!userData || !userData.id) {
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
	}, [boardInfo, id, basePixelSize, zoomLevel, selectedColor, userData, viewPosition, isPanning, drawPixel]);

	const exportToSVG = useCallback(() => {
		if (!boardInfo || !pixelsStateRef.current) return;

		const pixelSize = 10; // Taille des pixels dans le SVG
		const width = boardInfo.width * pixelSize;
		const height = boardInfo.height * pixelSize;

		let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

		svgContent += `<rect width="${width}" height="${height}" fill="${COLORS[0]}"/>`;

		Object.entries(pixelsStateRef.current).forEach(([key, color]) => {
			const [x, y] = key.split('_').map(Number);
			svgContent += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
		});

		svgContent += '</svg>';

		const blob = new Blob([svgContent], {type: 'image/svg+xml'});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `pixelboard-${id}-${new Date().toISOString()}.svg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [boardInfo, id]);

	const exportToPNG = useCallback(() => {
		if (!canvasRef.current) return;

		const dataUrl = canvasRef.current.toDataURL('image/png');

		const link = document.createElement('a');
		link.href = dataUrl;
		link.download = `pixelboard-${id}-${new Date().toISOString()}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, [id]);

	// Rendu du composant
	if (isLoading) {
		return <div className="board-loading">Loading board...</div>;
	}

	if (!boardInfo) {
		return <div className="board-error">Board not found</div>;
	}

	return (
		<div className="board-page">
			<div className="board-header">
				<h2 className="board-title">{boardInfo.name}</h2>
				<div className="board-status-container">
					<div className={`connection-status ${connectionStatus.toLowerCase()}`}>
						Status: {connectionStatus}
					</div>
					{userData ? (
						<div className="user-status">
							Connected as: <strong>{userData.username}</strong>
						</div>
					) : (
						<div className="user-status warning">
							Not connected (cannot place pixels)
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
						<button onClick={() => {
							handleResetZoom();
							handleBoardReset();
						}}>Reset
						</button>
					</div>

					<div className="export-controls">
						<button onClick={exportToSVG}>Export SVG</button>
						<button onClick={exportToPNG}>Export PNG</button>
						<Link to={`/pixelboards/${id}/heatmap`} className="heatmap-link">
							See Heatmap
						</Link>
					</div>
					<canvas
						ref={canvasRef}
						className={`board-canvas ${isPanning ? 'panning' : ''}`}
						style={{
							transform: `translate(${viewPosition.x}px, ${viewPosition.y}px) scale(${zoomLevel})`,
                            transformOrigin: '0 0'
                        }}
                        onClick={handleCanvasClick}
                        onContextMenu={handleContextMenu}
                        onMouseDown={handleMouseDown}
                        onMouseMove={(e) => {
                            handleMouseMove(e);
                            handleMouseHover(e);
                        }}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleCanvasMouseLeave}
                        onWheel={handleWheel}
                    />
					{pixelTooltip.visible && zoomLevel >= 1.5 && (
						<div
							className="pixel-tooltip"
							style={{
								position: 'fixed',
								top: pixelTooltip.mouseY,
								left: pixelTooltip.mouseX + 10,
								backgroundColor: 'rgba(0, 0, 0, 0.8)',
								color: 'white',
								padding: '5px 8px',
								borderRadius: '4px',
								fontSize: '12px',
								zIndex: 1000,
								pointerEvents: 'none'
							}}
						>
							{pixelTooltip.loading ? 'Nobody has claimed this pixel' : (
								<>
									Position: ({pixelTooltip.x}, {pixelTooltip.y})<br/>
									Placed by: {pixelTooltip.author}<br/>
									At : {new Date(pixelTooltip.timestamp).toLocaleString()}
								</>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default Board;
