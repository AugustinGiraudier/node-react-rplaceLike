const { createCanvas } = require('canvas');
const PixelBoard = require('../models/PixelBoard');
const Chunk = require('../models/Chunk');

// Configuration
const MAX_SNAPSHOT_SIZE = 600; // Taille maximale du côté le plus long en pixels
const SNAPSHOT_QUALITY = 0.8; // Qualité de l'image (0-1)

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

		// Calculer les dimensions du snapshot
		let scale = 1;
		if (board.width > board.height) {
			if (board.width > MAX_SNAPSHOT_SIZE) {
				scale = MAX_SNAPSHOT_SIZE / board.width;
			}
		} else {
			if (board.height > MAX_SNAPSHOT_SIZE) {
				scale = MAX_SNAPSHOT_SIZE / board.height;
			}
		}

		const canvasWidth = Math.ceil(board.width * scale);
		const canvasHeight = Math.ceil(board.height * scale);

		// Créer le canvas
		const canvas = createCanvas(canvasWidth, canvasHeight);
		const ctx = canvas.getContext('2d');

		// Fond blanc
		ctx.fillStyle = '#FFFFFF';
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		// Récupérer tous les chunks
		const chunks = await Chunk.find({ boardId: board._id });

		// Dessiner les pixels
		if (scale >= 1) {
			// Échelle 1:1 ou agrandissement - dessiner pixel par pixel
			for (const chunk of chunks) {
				const chunkX = chunk.x;
				const chunkY = chunk.y;

				for (let localY = 0; localY < board.chunkSize; localY++) {
					for (let localX = 0; localX < board.chunkSize; localX++) {
						const globalX = chunkX + localX;
						const globalY = chunkY + localY;

						if (globalX < board.width && globalY < board.height) {
							const pixelColor = getPixelColor(chunk.data, localX, localY, board.chunkSize);

							ctx.fillStyle = pixelColor;
							ctx.fillRect(
								Math.floor(globalX * scale),
								Math.floor(globalY * scale),
								Math.ceil(scale),
								Math.ceil(scale)
							);
						}
					}
				}
			}
		} else {
			// Réduction - utiliser un échantillonnage
			// Pour chaque pixel de destination, calculer la moyenne des pixels sources correspondants
			const pixelWidth = 1 / scale;
			const pixelHeight = 1 / scale;

			for (let y = 0; y < canvasHeight; y++) {
				for (let x = 0; x < canvasWidth; x++) {
					// Calculer la région source
					const sourceX = x / scale;
					const sourceY = y / scale;

					// Trouver le chunk correspondant
					const chunkX = Math.floor(sourceX / board.chunkSize) * board.chunkSize;
					const chunkY = Math.floor(sourceY / board.chunkSize) * board.chunkSize;

					const chunk = chunks.find(c => c.x === chunkX && c.y === chunkY);
					if (chunk) {
						const localX = Math.floor(sourceX) % board.chunkSize;
						const localY = Math.floor(sourceY) % board.chunkSize;
						const pixelColor = getPixelColor(chunk.data, localX, localY, board.chunkSize);

						ctx.fillStyle = pixelColor;
						ctx.fillRect(x, y, 1, 1);
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
