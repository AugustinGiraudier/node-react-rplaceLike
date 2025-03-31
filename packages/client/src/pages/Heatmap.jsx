import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from "react-router-dom";

import './Replay.css';
import './Heatmap.css';

const { VITE_API_URL } = import.meta.env;

function Heatmap() {
	const { id } = useParams();
	const canvasRef = useRef(null);
	const [boardInfo, setBoardInfo] = useState(null);
	const [heatmapData, setHeatmapData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isRegenerating, setIsRegenerating] = useState(false);

	// Modifications pour le zoom (même paramètres que dans Board.jsx)
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

	// Fonction pour générer une couleur en fonction du nombre de modifications
	const getHeatColor = useCallback((count, maxCount) => {
		// Échelle de couleur de rose clair à rouge foncé
		if (count === 0) return 'rgba(255, 255, 255, 0)'; // Transparent pour les zones sans modifications

		// Normalisation du compte entre 0 et 1
		const intensity = Math.min(count / maxCount, 1);

		// Génération de la couleur (rouge foncé pour les valeurs élevées)
		return `rgba(${Math.floor(155 + 100 * (1 - intensity))}, 0, 0, ${0.3 + 0.7 * intensity})`;
	}, []);

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

	// Nouvelle fonction handleBoardReset comme dans Board.jsx
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

	// Nouveau gestionnaire de zoom avec la molette, identique à Board.jsx
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

	// Fonction pour charger les données du board et de la heatmap
	const fetchData = useCallback(async (regenerate = false) => {
		try {
			setIsLoading(true);
			setError(null);

			// Récupérer le token d'authentification
			const token = localStorage.getItem('token');
			const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

			console.log(`[Heatmap] Récupération des informations du board: ${VITE_API_URL}/boards/${id}`);
			// Récupération des informations du board
			const boardResponse = await fetch(`${VITE_API_URL}/boards/${id}`);

			if (!boardResponse.ok) {
				throw new Error(`Échec de la récupération du board: ${boardResponse.statusText}`);
			}

			const boardData = await boardResponse.json();
			console.log(`[Heatmap] Données du board reçues:`, boardData);
			setBoardInfo(boardData);

			// Récupération des données de heatmap avec authentification
			// Ajouter un paramètre pour forcer la régénération
			const timestamp = Date.now(); // Cache busting
			const regenerateParam = regenerate ? '&regenerate=true' : '';
			const heatmapUrl = `${VITE_API_URL}/boards/${id}/heatmap?t=${timestamp}${regenerateParam}`;

			console.log(`[Heatmap] Récupération des données de heatmap: ${heatmapUrl}`);
			const heatmapResponse = await fetch(heatmapUrl, {
				headers: headers // Inclure le token d'authentification
			});

			console.log(`[Heatmap] Réponse de la heatmap:`, heatmapResponse.status, heatmapResponse.statusText);

			if (!heatmapResponse.ok) {
				if (heatmapResponse.status === 403) {
					throw new Error("Accès refusé à la heatmap. Vous devez être connecté ou avoir les permissions nécessaires.");
				} else {
					throw new Error(`Échec de la récupération de la heatmap: ${heatmapResponse.statusText}`);
				}
			}

			const heatmapData = await heatmapResponse.json();
			console.log(`[Heatmap] Données de heatmap reçues:`, heatmapData);
			setHeatmapData(heatmapData);
		} catch (error) {
			console.error('[Heatmap] Erreur lors de la récupération des données:', error);
			setError(error.message);
		} finally {
			setIsLoading(false);
			setIsRegenerating(false);
		}
	}, [id]);

	// Fonction pour régénérer la heatmap
	const regenerateHeatmap = useCallback(() => {
		setIsRegenerating(true);
		fetchData(true);
	}, [fetchData]);

	// Récupération des informations du board et de la heatmap
	useEffect(() => {
		console.log(`[Heatmap] Composant monté avec l'ID: ${id}`);
		console.log(`[Heatmap] URL de l'API: ${VITE_API_URL}`);

		fetchData(true); // Toujours régénérer au premier chargement
	}, [id, fetchData]);

	// Dessiner la heatmap
	useEffect(() => {
		console.log('[Heatmap] useEffect pour dessiner la heatmap appelé');

		if (!boardInfo || !heatmapData || !canvasRef.current) {
			console.log('[Heatmap] Dessin impossible:', {
				hasBoardInfo: !!boardInfo,
				hasHeatmapData: !!heatmapData,
				hasCanvasRef: !!canvasRef.current
			});
			return;
		}

		console.log('[Heatmap] Préparation du dessin avec:', {
			boardWidth: boardInfo.width,
			boardHeight: boardInfo.height,
			zoomLevel,
			pixelSize: basePixelSize,
			heatmapDataPoints: heatmapData.heatmapData.length
		});

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

		// Dessiner la grille (optionnel)
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

		console.log('[Heatmap] Dessin des pixels de la heatmap');

		try {
			// Dessiner les pixels de la heatmap
			heatmapData.heatmapData.forEach(pixel => {
				const { x, y, modificationCount } = pixel;

				// Calcul de la couleur en fonction du nombre de modifications
				ctx.fillStyle = getHeatColor(modificationCount, heatmapData.maxModifications);

				// Dessiner le pixel
				ctx.fillRect(
					x * basePixelSize,
					y * basePixelSize,
					basePixelSize,
					basePixelSize
				);
			});

			console.log('[Heatmap] Dessin terminé avec succès');
		} catch (error) {
			console.error('[Heatmap] Erreur lors du dessin de la heatmap:', error);
		}

	}, [boardInfo, heatmapData, zoomLevel, basePixelSize, getHeatColor]);

	// Empêcher l'ouverture du menu contextuel lors du clic droit
	const handleContextMenu = useCallback((event) => {
		event.preventDefault();
	}, []);

	// Nouveau gestionnaire pour le début du déplacement (identique à Board.jsx)
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

	// Nouveau gestionnaire pour le déplacement de la souris (identique à Board.jsx)
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

	// Nouveau gestionnaire pour la fin du déplacement (identique à Board.jsx)
	const handleMouseUp = useCallback((event) => {
		if (event.button === 2 && isPanning) {
			setIsPanning(false);
			document.body.style.cursor = 'auto';
		}
	}, [isPanning]);

	// Nouveau gestionnaire pour quitter la zone du canvas (identique à Board.jsx)
	const handleMouseLeave = useCallback(() => {
		if (isPanning) {
			setIsPanning(false);
			document.body.style.cursor = 'auto';
		}
	}, [isPanning]);

	// Rendu du composant
	if (isLoading && !isRegenerating) {
		return <div className="board-loading">Chargement de la heatmap...</div>;
	}

	if (error) {
		return (
			<div className="board-error">
				{/*eslint-disable-next-line*/}
				<h3>Impossible d'afficher la heatmap</h3>
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

	if (!boardInfo || !heatmapData) {
		return (
			<div className="board-error">
				<h3>Heatmap unavailable</h3>
				<p>Impossible de charger les données de la heatmap.</p>
				<Link to={`/pixelboards/${id}`} className="back-to-board">
					Retour au board
				</Link>
			</div>
		);
	}

	return (
		<div className="board-page">
			<div className="board-header">
				<h2 className="board-title">Heatmap: {boardInfo.name}</h2>
			</div>

			<div className="board-main">
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

					<button
						onClick={regenerateHeatmap}
						className="refresh-heatmap-button"
						disabled={isRegenerating}
						title="Régénérer la heatmap"
					>
						{isRegenerating ? '⏳' : '🔄'}
					</button>

					{isRegenerating && (
						<div className="regenerating-overlay">
							<div className="regenerating-message">Régénération de la heatmap...</div>
						</div>
					)}

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

				<div className="board-info-panel">
					<div className="board-details">
						<p>Total modifications: <strong>{heatmapData.totalModifications}</strong></p>
						<p>Max per pixel: <strong>{heatmapData.maxModifications}</strong></p>
						<p>Generated on: <strong>{new Date(heatmapData.generatedAt).toLocaleString()}</strong></p>
						<p>Dimensions: {boardInfo.width} x {boardInfo.height}</p>
						<p>Position:
							({Math.floor(-viewPosition.x / (basePixelSize * zoomLevel))}, {Math.floor(-viewPosition.y / (basePixelSize * zoomLevel))})</p>
						<p>Mode: {isPanning ? 'Panning' : 'Viewing'}</p>
						<p className="tip">Tip: Right click + drag to pan</p>
						<p className="tip">Tip: Scroll to zoom</p>
						<Link to={`/pixelboards/${id}`} className="back-to-board">
							Back to Board
						</Link>
						<Link to={`/pixelboards/${id}/replay`} className="back-to-board replay-heatmap-link">
							See Replay
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Heatmap;
