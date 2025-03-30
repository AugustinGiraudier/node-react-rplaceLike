import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from "react-router-dom";

import './Heatmap.css';

const { VITE_API_URL } = import.meta.env;

function Heatmap() {
	const { id } = useParams();
	const canvasRef = useRef(null);
	const [boardInfo, setBoardInfo] = useState(null);
	const [heatmapData, setHeatmapData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

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

	// Récupération des informations du board et de la heatmap
	useEffect(() => {
		const fetchBoardData = async () => {
			try {
				setIsLoading(true);
				
				// Récupération des informations du board
				const boardResponse = await fetch(`${VITE_API_URL}/boards/${id}`);
				if (!boardResponse.ok) {
					throw new Error(`Échec de la récupération du board: ${boardResponse.statusText}`);
				}
				const boardData = await boardResponse.json();
				setBoardInfo(boardData);
				
				// Récupération des données de heatmap
				const heatmapResponse = await fetch(`${VITE_API_URL}/boards/${id}/heatmap`);
				if (!heatmapResponse.ok) {
					throw new Error(`Échec de la récupération de la heatmap: ${heatmapResponse.statusText}`);
				}
				const heatmapData = await heatmapResponse.json();
				setHeatmapData(heatmapData);
			} catch (error) {
				console.error('Erreur lors de la récupération des données:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchBoardData();
	}, [id]);

	// Dessiner la heatmap
	useEffect(() => {
		if (!boardInfo || !heatmapData || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		// Définir les dimensions du canvas
		const currentPixelSize = basePixelSize * zoomLevel;
		canvas.width = boardInfo.width * currentPixelSize;
		canvas.height = boardInfo.height * currentPixelSize;

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
			ctx.moveTo(x * currentPixelSize, 0);
			ctx.lineTo(x * currentPixelSize, canvas.height);
			ctx.stroke();
		}
		for (let y = 0; y <= boardInfo.height; y++) {
			ctx.beginPath();
			ctx.moveTo(0, y * currentPixelSize);
			ctx.lineTo(canvas.width, y * currentPixelSize);
			ctx.stroke();
		}

		// Dessiner les pixels de la heatmap
		heatmapData.heatmapData.forEach(pixel => {
			const { x, y, modificationCount } = pixel;
			
			// Calcul de la couleur en fonction du nombre de modifications
			ctx.fillStyle = getHeatColor(modificationCount, heatmapData.maxModifications);
			
			// Dessiner le pixel
			ctx.fillRect(
				x * currentPixelSize,
				y * currentPixelSize,
				currentPixelSize,
				currentPixelSize
			);
		});

	}, [boardInfo, heatmapData, zoomLevel, basePixelSize, getHeatColor]);

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

	// Rendu du composant
	if (isLoading) {
		return <div className="board-loading">Chargement de la heatmap...</div>;
	}

	if (!boardInfo || !heatmapData) {
		return <div className="board-error">Heatmap unavailable</div>;
	}

	return (
		<div className="board-page">
			<div className="board-header">
				<h2 className="board-title">Heatmap: {boardInfo.name}</h2>
				<div className="board-status-container">
					<div className="heatmap-info">
						Total des modifications: <strong>{heatmapData.totalModifications}</strong>
						<span className="separator">|</span>
						Max par pixel: <strong>{heatmapData.maxModifications}</strong>
						<span className="separator">|</span>
						Généré le: <strong>{new Date(heatmapData.generatedAt).toLocaleString()}</strong>
					</div>
				</div>
			</div>

			<div className="board-main">

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
						<p>Dimensions: {boardInfo.width} x {boardInfo.height}</p>
						<p>Position: ({Math.floor(-viewPosition.x / pixelSize)}, {Math.floor(-viewPosition.y / pixelSize)})</p>
						<p>Zoom: {Math.round(zoomLevel * 100)}%</p>
						<p>Mode: {isPanning ? 'Déplacement' : 'Visualisation'}</p>
						<p className="tip">Astuce: Clic droit + déplacer pour naviguer</p>
						<p className="tip">Astuce: Molette pour zoomer</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Heatmap;