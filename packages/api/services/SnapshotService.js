const { createCanvas } = require('canvas');
const PixelBoard = require('../models/PixelBoard');
const Chunk = require('../models/Chunk');

// Configuration
const SNAPSHOT_SIZE = 128; // Taille fixe de la snapshot en pixels
const SNAPSHOT_QUALITY = 1; // Qualité de l'image (0-1)

// Palette de couleurs du service PixelBoardService
const COLOR_PALETTE = [
	'#FFFFFF', '#E4E4E4', '#888888', '#222222',
	'#FFA7D1', '#E50000', '#E59500', '#A06A42',
	'#E5D900', '#94E044', '#02BE01', '#00D3DD',
	'#0083C7', '#0000EA', '#CF6EE4', '#820080'
];

/**
 * Détermine si un snapshot doit être mis à jour
 * @param {Object} board - L'objet PixelBoard
 * @returns {Boolean} - Vrai si le snapshot doit être mis à jour
 */
const shouldUpdateSnapshot = (board) => {
	if (!board.snapshot || !board.snapshotLastUpdated) {
		return true; // Pas encore de snapshot
	}

	const now = new Date();
	const elapsedTime = (now - board.snapshotLastUpdated) / 1000; // en secondes
	return elapsedTime > board.snapshotUpdateInterval;
};

/**
 * Extraction de la couleur depuis un chunk pour un pixel donné
 * @param {Buffer} data - Données binaires du chunk
 * @param {Number} localX - Position X locale dans le chunk
 * @param {Number} localY - Position Y locale dans le chunk
 * @param {Number} chunkSize - Taille du chunk
 * @returns {String} - Code couleur hexadécimal
 */
const getPixelColor = (data, localX, localY, chunkSize) => {
	const pixelIndex = localY * chunkSize + localX;
	const byteIndex = Math.floor(pixelIndex / 2);
	const isUpperNibble = pixelIndex % 2 === 0;

	const byte = data[byteIndex];
	const colorIndex = isUpperNibble ? (byte >> 4) & 0x0F : byte & 0x0F;

	return COLOR_PALETTE[colorIndex];
};

/**
 * Génère un snapshot pour un board et le stocke directement dans la base de données
 * @param {String} boardId - ID du board
 * @param {Boolean} force - Force la mise à jour même si l'intervalle n'est pas écoulé
 * @returns {Promise<Object>} - Infos du snapshot généré
 */
const generateSnapshot = async (boardId, force = false) => {
	try {
		// Récupérer le board
		const board = await PixelBoard.findById(boardId);
		if (!board) {
			throw new Error('Board not found');
		}

		// Vérifier si une mise à jour est nécessaire
		if (!force && !shouldUpdateSnapshot(board)) {
			return {
				boardId: board._id,
				updated: false,
				snapshotLastUpdated: board.snapshotLastUpdated
			};
		}

		// Taille fixe du canvas pour la snapshot
		const canvasWidth = SNAPSHOT_SIZE;
		const canvasHeight = SNAPSHOT_SIZE;

		// Calculer les coordonnées du centre du board
		const centerX = Math.floor(board.width / 2);
		const centerY = Math.floor(board.height / 2);

		// Calculer les coordonnées de départ pour capturer le centre du board
		// Si le board est plus petit que SNAPSHOT_SIZE, on affichera le board entier, centré
		const startX = Math.max(0, centerX - Math.floor(SNAPSHOT_SIZE / 2));
		const startY = Math.max(0, centerY - Math.floor(SNAPSHOT_SIZE / 2));

		// Calculer les offsets pour centrer les petits boards dans le canvas
		const offsetX = board.width < SNAPSHOT_SIZE ? Math.floor((SNAPSHOT_SIZE - board.width) / 2) : 0;
		const offsetY = board.height < SNAPSHOT_SIZE ? Math.floor((SNAPSHOT_SIZE - board.height) / 2) : 0;

		// Créer le canvas
		const canvas = createCanvas(canvasWidth, canvasHeight);
		const ctx = canvas.getContext('2d');

		// Fond blanc
		ctx.fillStyle = '#FFFFFF';
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		// Récupérer tous les chunks
		const chunks = await Chunk.find({ boardId: board._id });

		// Créer un index de chunks pour une recherche plus efficace
		const chunkMap = {};
		for (const chunk of chunks) {
			const key = `${chunk.x},${chunk.y}`;
			chunkMap[key] = chunk;
		}

		// Parcourir le canvas pixel par pixel
		for (let canvasY = 0; canvasY < canvasHeight; canvasY++) {
			for (let canvasX = 0; canvasX < canvasWidth; canvasX++) {
				// Calculer les coordonnées correspondantes dans le board
				const boardX = canvasX - offsetX + startX;
				const boardY = canvasY - offsetY + startY;

				// Vérifier si les coordonnées sont dans les limites du board
				if (boardX >= 0 && boardX < board.width && boardY >= 0 && boardY < board.height) {
					// Trouver le chunk correspondant
					const chunkX = Math.floor(boardX / board.chunkSize) * board.chunkSize;
					const chunkY = Math.floor(boardY / board.chunkSize) * board.chunkSize;

					const chunkKey = `${chunkX},${chunkY}`;
					const chunk = chunkMap[chunkKey];

					if (chunk) {
						const localX = boardX % board.chunkSize;
						const localY = boardY % board.chunkSize;
						const pixelColor = getPixelColor(chunk.data, localX, localY, board.chunkSize);

						ctx.fillStyle = pixelColor;
						ctx.fillRect(canvasX, canvasY, 1, 1);
					}
				}
			}
		}

		// Convertir en Base64
		const mimeType = 'image/png';
		const base64Data = canvas.toDataURL(mimeType, SNAPSHOT_QUALITY).split(',')[1];

		// Mettre à jour le board
		board.snapshot = base64Data;
		board.snapshotMimeType = mimeType;
		board.snapshotLastUpdated = new Date();
		await board.save();

		return {
			boardId: board._id,
			updated: true,
			snapshotLastUpdated: board.snapshotLastUpdated,
			width: canvasWidth,
			height: canvasHeight
		};
	} catch (error) {
		console.error('Error generating snapshot:', error);
		throw error;
	}
};

/**
 * Récupère le snapshot d'un board, en le générant si nécessaire
 * @param {String} boardId - ID du board
 * @returns {Promise<Object>} - Données du snapshot
 */
const getSnapshot = async (boardId) => {
	try {
		const board = await PixelBoard.findById(boardId);
		if (!board) {
			throw new Error('Board not found');
		}

		if (shouldUpdateSnapshot(board)) {
			await generateSnapshot(boardId);
			// Récupérer le board mis à jour
			return await PixelBoard.findById(boardId, 'snapshot snapshotMimeType snapshotLastUpdated');
		}

		return {
			snapshot: board.snapshot,
			mimeType: board.snapshotMimeType,
			lastUpdated: board.snapshotLastUpdated
		};
	} catch (error) {
		console.error('Error retrieving snapshot:', error);
		throw error;
	}
};

/**
 * Régénère tous les snapshots des boards actifs
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const regenerateAllSnapshots = async () => {
	try {
		const activeBoards = await PixelBoard.find({ status: { $in: ['active', 'non-active'] } });

		const results = {
			total: activeBoards.length,
			success: 0,
			failed: 0,
			errors: []
		};

		for (const board of activeBoards) {
			try {
				await generateSnapshot(board._id, true);
				results.success++;
			} catch (error) {
				results.failed++;
				results.errors.push({
					boardId: board._id,
					name: board.name,
					error: error.message
				});
			}
		}

		return results;
	} catch (error) {
		console.error('Error regenerating all snapshots:', error);
		throw error;
	}
};

module.exports = {
	generateSnapshot,
	getSnapshot,
	regenerateAllSnapshots,
	shouldUpdateSnapshot
};
