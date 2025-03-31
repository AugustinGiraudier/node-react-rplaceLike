import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from "react-router-dom";
import './Replay.css';

const { VITE_API_URL } = import.meta.env;

function Replay() {
	const { id } = useParams();
	const canvasRef = useRef(null);
	const [boardInfo, setBoardInfo] = useState(null);
	const [replayData, setReplayData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	
	// États pour le contrôle de lecture
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(10); // Durée en secondes (par défaut 10s)
	const requestIdRef = useRef(null);
	const startTimeRef = useRef(null);
	const pixelsRenderedRef = useRef(0);
	
	// Modifications pour le zoom (même paramètres que dans Heatmap.jsx)
	const [zoomLevel, setZoomLevel] = useState(1);
	const basePixelSize = 12; // Taille de base d'un pixel

	// Min et max zoom
	const MIN_ZOOM = 0.2;
	const MAX_ZOOM = 2;  // Limité à 200%
	const ZOOM_STEP = 0.2;

	// États pour le déplacement (panning)
	const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
	const [isPanning, setIsPanning] = useState(false);
	const [panStartPosition, setPanStartPosition] = useState({ x: 0, y: 0 });

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

	// Fonction handleBoardReset comme dans Heatmap.jsx
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

	// Gestionnaire de zoom avec la molette
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

	// Fonction pour charger les données du board et du replay
	const fetchData = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Récupérer le token d'authentification
			const token = localStorage.getItem('token');
			const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

			console.log(`[Replay] Récupération des informations du board: ${VITE_API_URL}/boards/${id}`);
			// Récupération des informations du board
			const boardResponse = await fetch(`${VITE_API_URL}/boards/${id}`);

			if (!boardResponse.ok) {
				throw new Error(`Échec de la récupération du board: ${boardResponse.statusText}`);
			}

			const boardData = await boardResponse.json();
			console.log(`[Replay] Données du board reçues:`, boardData);
			setBoardInfo(boardData);

			// Récupération des données de replay avec authentification
			const replayUrl = `${VITE_API_URL}/boards/${id}/replay`;

			console.log(`[Replay] Récupération des données de replay: ${replayUrl}`);
			const replayResponse = await fetch(replayUrl, {
				headers: headers // Inclure le token d'authentification
			});

			console.log(`[Replay] Réponse du replay:`, replayResponse.status, replayResponse.statusText);

			if (!replayResponse.ok) {
				if (replayResponse.status === 403) {
					throw new Error("Accès refusé au replay. Vous devez être connecté ou avoir les permissions nécessaires.");
				} else {
					throw new Error(`Échec de la récupération du replay: ${replayResponse.statusText}`);
				}
			}

			const replayData = await replayResponse.json();
			console.log(`[Replay] Données de replay reçues: ${replayData.length} actions`);
			setReplayData(replayData);
		} catch (error) {
			console.error('[Replay] Erreur lors de la récupération des données:', error);
			setError(error.message);
		} finally {
			setIsLoading(false);
		}
	}, [id]);

	// Récupération des informations du board et du replay
	useEffect(() => {
		console.log(`[Replay] Composant monté avec l'ID: ${id}`);
		fetchData();
		return () => {
			// Nettoyage lorsque le composant est démonté
			if (requestIdRef.current) {
				cancelAnimationFrame(requestIdRef.current);
			}
		};
	}, [id, fetchData]);

	// Initialisation du canvas
	useEffect(() => {
		if (!boardInfo || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		// Définir les dimensions du canvas
		canvas.width = boardInfo.width * basePixelSize;
		canvas.height = boardInfo.height * basePixelSize;

		// Effacer le canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Remplir le fond avec une couleur claire
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Dessiner la grille
		ctx.strokeStyle = '#e0e0e0';
		ctx.lineWidth = 0.5;
		for (let x = 0; x <= boardInfo.width; x++) {
			ctx.beginPath();
			ctx.moveTo(x * basePixelSize, 0);
			ctx.lineTo(x * basePixelSize, canvas.height);
			ctx.stroke();
		}
		for (let y = 0; y <= boardInfo.height; y++) {
			ctx.beginPath();
			ctx.moveTo(0, y * basePixelSize);
			ctx.lineTo(canvas.width, y * basePixelSize);
			ctx.stroke();
		}

		console.log('[Replay] Canvas initialisé');
	}, [boardInfo, basePixelSize]);

	// Fonction de rendu du replay
	const renderFrame = useCallback((timestamp) => {
		if (!replayData || !canvasRef.current || !boardInfo) return;

		if (!startTimeRef.current) {
			startTimeRef.current = timestamp;
			pixelsRenderedRef.current = 0;
		}

		const elapsed = timestamp - startTimeRef.current;
		const progress = Math.min(elapsed / (duration * 1000), 1);
		setCurrentTime(progress * duration);

		// Mettre à jour le canvas avec les pixels jusqu'au temps actuel
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		// Trouver les pixels à rendre dans cette frame
		let newPixelsRendered = 0;
		for (let i = pixelsRenderedRef.current; i < replayData.length; i++) {
			const pixel = replayData[i];
			if (pixel.relativeTimeNormalized <= progress) {
				// Dessiner le pixel
				ctx.fillStyle = pixel.color;
				ctx.fillRect(
					pixel.x * basePixelSize,
					pixel.y * basePixelSize,
					basePixelSize,
					basePixelSize
				);
				newPixelsRendered++;
			} else {
				break;
			}
		}

		// Mettre à jour le nombre de pixels rendus
		pixelsRenderedRef.current += newPixelsRendered;

		// Continuer l'animation si on n'a pas atteint la fin
		if (progress < 1 && isPlaying) {
			requestIdRef.current = requestAnimationFrame(renderFrame);
		} else if (progress >= 1) {
			setIsPlaying(false);
		}
	}, [replayData, duration, isPlaying, boardInfo, basePixelSize]);

	// Démarrer/Arrêter l'animation
	useEffect(() => {
		if (isPlaying) {
			startTimeRef.current = null;
			requestIdRef.current = requestAnimationFrame(renderFrame);
		} else if (requestIdRef.current) {
			cancelAnimationFrame(requestIdRef.current);
		}

		return () => {
			if (requestIdRef.current) {
				cancelAnimationFrame(requestIdRef.current);
			}
		};
	}, [isPlaying, renderFrame]);

	// Fonction pour réinitialiser le replay
	const resetReplay = useCallback(() => {
		if (!canvasRef.current || !boardInfo) return;

		setIsPlaying(false);
		setCurrentTime(0);
		pixelsRenderedRef.current = 0;
		startTimeRef.current = null;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		// Effacer le canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Remplir le fond avec une couleur claire
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Redessiner la grille
		ctx.strokeStyle = '#e0e0e0';
		ctx.lineWidth = 0.5;
		for (let x = 0; x <= boardInfo.width; x++) {
			ctx.beginPath();
			ctx.moveTo(x * basePixelSize, 0);
			ctx.lineTo(x * basePixelSize, canvas.height);
			ctx.stroke();
		}
		for (let y = 0; y <= boardInfo.height; y++) {
			ctx.beginPath();
			ctx.moveTo(0, y * basePixelSize);
			ctx.lineTo(canvas.width, y * basePixelSize);
			ctx.stroke();
		}
	}, [boardInfo, basePixelSize]);

	// Changer la durée du replay
	const changeDuration = useCallback((newDuration) => {
		setDuration(newDuration);
		resetReplay();
	}, [resetReplay]);

	// Fonction pour gérer le déplacement de la timeline
	const handleTimelineChange = useCallback((e) => {
		const newProgress = parseFloat(e.target.value);
		setCurrentTime(newProgress * duration);

		// Annuler l'animation en cours
		if (requestIdRef.current) {
			cancelAnimationFrame(requestIdRef.current);
		}

		// Réinitialiser le canvas
		if (!canvasRef.current || !boardInfo || !replayData) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		// Effacer le canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Remplir le fond avec une couleur claire
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Redessiner la grille
		ctx.strokeStyle = '#e0e0e0';
		ctx.lineWidth = 0.5;
		for (let x = 0; x <= boardInfo.width; x++) {
			ctx.beginPath();
			ctx.moveTo(x * basePixelSize, 0);
			ctx.lineTo(x * basePixelSize, canvas.height);
			ctx.stroke();
		}
		for (let y = 0; y <= boardInfo.height; y++) {
			ctx.beginPath();
			ctx.moveTo(0, y * basePixelSize);
			ctx.lineTo(canvas.width, y * basePixelSize);
			ctx.stroke();
		}

		// Dessiner les pixels jusqu'au temps actuel
		const progress = newProgress;
		pixelsRenderedRef.current = 0;
		
		for (let i = 0; i < replayData.length; i++) {
			const pixel = replayData[i];
			if (pixel.relativeTimeNormalized <= progress) {
				// Dessiner le pixel
				ctx.fillStyle = pixel.color;
				ctx.fillRect(
					pixel.x * basePixelSize,
					pixel.y * basePixelSize,
					basePixelSize,
					basePixelSize
				);
				pixelsRenderedRef.current++;
			} else {
				break;
			}
		}

		// Si la lecture était en cours, on met à jour le point de départ
		if (isPlaying) {
			startTimeRef.current = null;
			requestIdRef.current = requestAnimationFrame(renderFrame);
		}
	}, [boardInfo, replayData, basePixelSize, duration, isPlaying, renderFrame]);

	// Empêcher l'ouverture du menu contextuel lors du clic droit
	const handleContextMenu = useCallback((event) => {
		event.preventDefault();
	}, []);

	// Gestionnaire pour le début du déplacement (panning)
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

	// Gestionnaire pour le déplacement de la souris
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

	// Gestionnaire pour la fin du déplacement
	const handleMouseUp = useCallback((event) => {
		if (event.button === 2 && isPanning) {
			setIsPanning(false);
			document.body.style.cursor = 'auto';
		}
	}, [isPanning]);

	// Gestionnaire pour quitter la zone du canvas
	const handleMouseLeave = useCallback(() => {
		if (isPanning) {
			setIsPanning(false);
			document.body.style.cursor = 'auto';
		}
	}, [isPanning]);

	// Formater le temps
	const formatTime = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	// Rendu du composant
	if (isLoading) {
		return <div className="board-loading">Chargement du replay...</div>;
	}

	if (error) {
		return (
			<div className="board-error">
				<h3>Impossible d&apos;afficher le replay</h3>
				<p>{error}</p>
				<div className="error-actions">
					<Link to={`/pixelboards/${id}`} className="back-to-board">
						Retour au board
					</Link>
					{!localStorage.getItem('token') && (
						<Link to="/login" className="login-link">
							Se connecter
						</Link>
					)}
				</div>
			</div>
		);
	}

	if (!boardInfo || !replayData) {
		return (
			<div className="board-error">
				<h3>Replay indisponible</h3>
				<p>Impossible de charger les données du replay.</p>
				<Link to={`/pixelboards/${id}`} className="back-to-board">
					Retour au board
				</Link>
			</div>
		);
	}

	return (
		<div className="board-page">
			<div className="board-header">
				<h2 className="board-title">Replay: {boardInfo.name}</h2>
			</div>

			<div className="board-main replay-board-main">

				<div className='replay-container-left-part'>
					<div className="canvas-container replay_canvas-container">
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

						<canvas
							ref={canvasRef}
							className={`board-canvas ${isPanning ? 'panning' : ''}`}
							style={{
								transform: `translate(${viewPosition.x}px, ${viewPosition.y}px) scale(${zoomLevel})`,
								transformOrigin: '0 0'
							}}
							onContextMenu={handleContextMenu}
							onMouseDown={handleMouseDown}
							onMouseMove={handleMouseMove}
							onMouseUp={handleMouseUp}
							onMouseLeave={handleMouseLeave}
							onWheel={handleWheel}
						/>
					</div>

					<div className="replay-controls">
						<div className='replay-up'>
							<div className="replay-buttons">
								<button 
									className="replay-button" 
									onClick={() => setIsPlaying(!isPlaying)}
								>
									{isPlaying ? '⏸️' : '▶️'}
								</button>
								<button 
									className="replay-button" 
									onClick={resetReplay}
								>
									⏮️
								</button>
							</div>

							<div className="replay-speed-controls">
								<button 
									className={`speed-button ${duration === 10 ? 'active' : ''}`} 
									onClick={() => changeDuration(10)}
								>
									10s
								</button>
								<button 
									className={`speed-button ${duration === 30 ? 'active' : ''}`} 
									onClick={() => changeDuration(30)}
								>
									30s
								</button>
								<button 
									className={`speed-button ${duration === 60 ? 'active' : ''}`} 
									onClick={() => changeDuration(60)}
								>
									1m
								</button>
								<button 
									className={`speed-button ${duration === 300 ? 'active' : ''}`} 
									onClick={() => changeDuration(300)}
								>
									5m
								</button>
							</div>
						</div>
							
						<div className="replay-timeline-container">
							<div className="replay-time">{formatTime(currentTime)}</div>
							<input
								type="range"
								min="0"
								max="1"
								step="0.001"
								value={currentTime / duration}
								onChange={handleTimelineChange}
								className="replay-timeline"
							/>
							<div className="replay-time">{formatTime(duration)}</div>
						</div>
							
							
					</div>
				</div>

			
				<div className="board-info-panel replay-board-info-panel">
					<div className="board-details replay-board-details">
						<p>Total actions: <strong>{replayData.length}</strong></p>
						<p>Rendered pixels: <strong>{pixelsRenderedRef.current} / {replayData.length}</strong></p>
						<p>Progression: <strong>{Math.round((currentTime / duration) * 100)}%</strong></p>
						<p>Duration: <strong>{formatTime(duration)}</strong></p>
						<p>Dimensions: {boardInfo.width} x {boardInfo.height}</p>
						<p>Position:
							({Math.floor(-viewPosition.x / (basePixelSize * zoomLevel))}, {Math.floor(-viewPosition.y / (basePixelSize * zoomLevel))})</p>
						<p className="tip">Tip: Right click + drag to pan</p>
						<p className="tip">Tip: Scroll to zoom</p>
						<Link to={`/pixelboards/${id}`} className="back-to-board">
							Back to Board
						</Link>
						<Link to={`/pixelboards/${id}/heatmap`} className="back-to-board replay-heatmap-link">
							See Heatmap
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Replay;