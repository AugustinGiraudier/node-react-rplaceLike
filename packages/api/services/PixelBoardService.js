const PixelBoard = require("../models/PixelBoard");
const Chunk = require("../models/Chunk");
const PixelModification = require("../models/PixelModification");
const { getUser } = require("../services/userService");
const { addUserPixel } = require("./UserService");

// ----------- GLOBAL -------------
const COLOR_PALETTE = [
	'#FFFFFF', '#E4E4E4', '#888888', '#222222',
	'#FFA7D1', '#E50000', '#E59500', '#A06A42',
	'#E5D900', '#94E044', '#02BE01', '#00D3DD',
	'#0083C7', '#0000EA', '#CF6EE4', '#820080'
];

const COLOR_INDEX = {
	"#FFFFFF": 0, "#E4E4E4": 1, "#888888": 2, "#222222": 3,
	"#FFA7D1": 4, "#E50000": 5, "#E59500": 6, "#A06A42": 7,
	"#E5D900": 8, "#94E044": 9, "#02BE01": 10, "#00D3DD": 11,
	"#0083C7": 12, "#0000EA": 13, "#CF6EE4": 14, "#820080": 15
};

// ----------- USER -------------

/**
 * Récupère tous les boards.
 * @returns {Promise<Array>} - Liste des boards
 */
const getAllBoards = async () => {
	return PixelBoard.find({}, {
		chunks: 0
	}).populate('author', "username");
};

/**
 * Récupère un board avec son id
 * @returns {Promise} - info board
 */
const getBoard = async (id) => {
	return PixelBoard.findById(id, {chunks: 0});
};

const transformChunkToPixelData = (chunk, startX = null, startY = null, width = null, height = null) => {
	if (!chunk || !chunk.data || !Buffer.isBuffer(chunk.data)) {
		console.warn('Chunk not valid or missing data');
		return {};
	}

	const pixelMap = {};
	const chunkSize = 16;
	const DEFAULT_COLOR_INDEX = COLOR_INDEX['#FFFFFF'];

	// Limites pour le filtrage (optionnel)
	const minX = startX !== null ? Math.max(chunk.x, startX) : chunk.x;
	const minY = startY !== null ? Math.max(chunk.y, startY) : chunk.y;
	const maxX = width !== null ? Math.min(chunk.x + chunkSize, startX + width) : chunk.x + chunkSize;
	const maxY = height !== null ? Math.min(chunk.y + chunkSize, startY + height) : chunk.y + chunkSize;

	for (let localY = 0; localY < chunkSize; localY++) {
		for (let localX = 0; localX < chunkSize; localX++) {
			const globalX = chunk.x + localX;
			const globalY = chunk.y + localY;

			// Filtrer selon les limites fournies
			if (globalX >= minX && globalX < maxX && globalY >= minY && globalY < maxY) {
				const pixelIndex = localY * chunkSize + localX;
				const byteIndex = Math.floor(pixelIndex / 2);
				const isUpperNibble = pixelIndex % 2 === 0;

				const byte = chunk.data[byteIndex];
				const colorIndex = isUpperNibble ? (byte >> 4) & 0x0F : byte & 0x0F;

				if (colorIndex !== DEFAULT_COLOR_INDEX) {
					pixelMap[`${globalX}_${globalY}`] = COLOR_PALETTE[colorIndex];
				}
			}
		}
	}

	return pixelMap;
};
/**
 * Récupère un chunk avec ses données.
 * @param {string} boardId - ID du board
 * @param {number} pixelX - Coordonnée X d'un pixel dans le chunk
 * @param {number} pixelY - Coordonnée Y d'un pixel dans le chunk
 * @param transform - Indique si les données doivent être transformées
 * @returns {Promise<Object>} - Données du chunk au format simplifié ou brut
 */
const getChunk = async (boardId, pixelX, pixelY, transform = true) => {
	const chunkX = Math.floor(pixelX / 16) * 16;
	const chunkY = Math.floor(pixelY / 16) * 16;

	const chunk = await Chunk.findOne({ boardId, x: chunkX, y: chunkY });

	if (!chunk) return null;

	if (transform) {
		return {
			chunkCoordinates: { x: chunkX, y: chunkY },
			defaultColor: COLOR_PALETTE[0],
			pixels: transformChunkToPixelData(chunk)
		};
	}

	return chunk;
};

/**
 * Récupère une région du board avec transformation des données.
 * @param {string} boardId - ID du board
 * @param {number} startX - Coordonnée X de départ
 * @param {number} startY - Coordonnée Y de départ
 * @param {number} width - Largeur de la région
 * @param {number} height - Hauteur de la région
 * @returns {Promise<Object>} - Données de la région au format simplifié
 */
const getRegion = async (boardId, startX, startY, width, height) => {
	try {
		const board = await PixelBoard.findById(boardId);
		if (!board) throw new Error('Board not found');

		const chunks = await Chunk.find({
			boardId,
			x: { $gte: Math.floor(startX / 16) * 16, $lt: Math.ceil((startX + width) / 16) * 16 },
			y: { $gte: Math.floor(startY / 16) * 16, $lt: Math.ceil((startY + height) / 16) * 16 }
		});

		console.log(`found ${chunks.length} chunks`);

		// Utiliser la même fonction de transformation pour tous les chunks
		let pixelMap = {};
		for (const chunk of chunks) {
			// Fusionner les résultats de chaque chunk
			Object.assign(pixelMap, transformChunkToPixelData(chunk, startX, startY, width, height));
		}

		return {
			region: { x: startX, y: startY, width, height },
			defaultColor: COLOR_PALETTE[0],
			pixels: pixelMap
		};
	} catch (error) {
		console.error('Erreur dans getRegion:', error);
		throw error;
	}
};
/**
 * Met à jour la couleur d'un pixel dans un chunk.
 * @param {string} boardId - ID du board
 * @param {number} x - Coordonnée X du pixel
 * @param {number} y - Coordonnée Y du pixel
 * @param {string} color - Couleur en hex (ex: "#FF0000")
 * @param {string} userId - ID de l'utilisateur
 */

const updatePixel = async (boardId, x, y, color, userId) => {

	if(!await checkPlacementDelay(userId, boardId)){
		throw new Error(`Cannot place Pixel...`);
	};

	const chunkSize = 16;
	const chunkX = Math.floor(x / chunkSize) * chunkSize;
	const chunkY = Math.floor(y / chunkSize) * chunkSize;
	const localX = x % chunkSize;
	const localY = y % chunkSize;

	console.log(`Updating pixel at (${x},${y}) to color ${color} in chunk (${chunkX},${chunkY})`);

	const chunk = await Chunk.findOne({ boardId, x: chunkX, y: chunkY });
	if (!chunk) throw new Error(`Chunk not found at (${chunkX},${chunkY})`);

	const pixelIndex = localY * chunkSize + localX;
	const byteIndex = Math.floor(pixelIndex / 2); // 2 pixels par octet
	const isUpperNibble = pixelIndex % 2 === 0;

	console.log(`Pixel index: ${pixelIndex}, Byte index: ${byteIndex}, Upper nibble: ${isUpperNibble}`);
	console.log(`Current data at byte ${byteIndex}: ${chunk.data[byteIndex].toString(16)}`);

	if (!COLOR_INDEX[color.toUpperCase()]) {
		throw new Error(`Color ${color} invalid`);
	}
	const colorValue = COLOR_INDEX[color.toUpperCase()];
	console.log(`Color ${color} mapped to index ${colorValue}`);

	/**
	 * On veut passer en rouge COLOR_INDEX['E50000'] = 5
	 * Position dans le buffer:  ... 25       26       27 ...
	 * Valeur (hex):            ... 0xB2     0x3F     0xC1 ...
	 * Valeur (binaire):        ... 10110010 00111111 11000001 ...
	 *                                       ↑
	 *                                  Octet à modifier
	 *
	 * 0x3F = 00111111 (binaire)
	 *        0011 1111
	 *        │││  │││
	 *        ┕━┙  ┕━┙
	 *         3    F   (hex)
	 *
	 * . Valeur actuelle:        0x3F = 00111111
	 *                                   0011 1111
	 *                                        ↑↑↑↑
	 *                                    Bits à changer
	 *
	 * 2. Préserver bits supérieurs:
	 *    byte & 0xF0            = 00111111 & 11110000
	 *                           = 00110000 (0x30)
	 *                             ↑↑↑↑
	 *                         Ces bits sont préservés
	 *
	 * 3. Nouvelle couleur : colorValue = 5 = 0101 (binaire)
	 *
	 *
	 * 4. Combiner avec OR:
	 *    (byte & 0xF0) | colorValue = 00110000 | 00000101 (0x05) Pourquoi ? Dans COLOR_INDEX, rouge c'est 5
	 *                               = 00110101 (0x35)
	 *
	 * 5. Etat final
	 * Position dans le buffer:  ... 25       26       27 ...
	 * Valeur (hex):            ... 0xB2     0x35     0xC1 ...
	 * Valeur (binaire):        ... 10110010 00110101 11000001 ...
	 *                                         ↑↑↑↑
	 *                                    Bits modifiés
	 *
	 */
	let byte = chunk.data[byteIndex];
	if (isUpperNibble) {
		// Modifier les 4 bits de poids fort
		byte = (byte & 0x0F) | (colorValue << 4);
	} else {
		// Modifier les 4 bits de poids faible
		byte = (byte & 0xF0) | colorValue;
	}
	const user = await getUser(userId);
	if (!user) throw new Error("User not found");
	console.log(`New byte value: ${byte.toString(16)}`);
	chunk.data[byteIndex] = byte;
	chunk.markModified('data'); // Important : MongoDB ne détecte pas les modifications dans les Buffer merci claude pour l'info
	chunk.lastUpdated = new Date();
	await chunk.save();
	await addUserPixel(userId);
	await user.save();

	await PixelModification.create({
		boardId,
		x,
		y,
		color,
		userId,
		timestamp: new Date()
	});

	return { x, y, color, userId };
};

/**
 * Vérifie si l'utilisateur respecte le délai de placement pour un board spécifique
 * @param {string} userId - L'identifiant de l'utilisateur
 * @param {string} boardId - L'identifiant du board
 * @throws {Error} - Lance une erreur si le délai n'est pas respecté
 * @returns {Promise<boolean>} - Retourne true si l'utilisateur peut placer un pixel
 */
async function checkPlacementDelay(userId, boardId) {
	
	// Récupérer les informations du board
	const board = await PixelBoard.findById(boardId);
	if (!board) {
		throw new Error(`Board non trouvé (ID: ${boardId})`);
	}
	
	// Vérifier si le board est actif
	if (board.status !== 'active') {
		throw new Error(`Ce board n'est pas actif (statut: ${board.status})`);
	}
	
	// Récupérer le dernier placement de l'utilisateur sur ce board
	const lastPlacement = await PixelModification.findOne({
		userId: userId,
		boardId: boardId
	})
	.sort({ timestamp: -1 })
	.lean();
	
	// Si l'utilisateur n'a jamais placé de pixel sur ce board, il peut en placer un
	if (!lastPlacement) {
		return true;
	}
		
	// Calculer le temps écoulé depuis le dernier placement (en millisecondes)
	const now = new Date();
	const lastPlacementTime = new Date(lastPlacement.timestamp);
	const timeElapsed = now - lastPlacementTime;

	console.log(timeElapsed);
	
	// Convertir le délai de placement du board en millisecondes
	// Supposons que placementDelay est stocké en secondes dans le schéma
	const requiredDelay = board.placementDelay;
	
	// Vérifier si le temps écoulé est inférieur au délai requis
	if (timeElapsed < requiredDelay) {
		return false;
	}
	
	// Si nous arrivons ici, l'utilisateur peut placer un pixel
	return true;
}

// ----------- ADMIN -------------

/**
 * Crée un nouveau PixelBoard avec des chunks initialisés.
 * @param {Object} data - Données du board (name, author, width, height, placementDelay)
 * @returns {Promise<Object>} - Le board créé
 *
 * Méthode des pixels pris de reddit : https://redditinc.com/blog/how-we-built-rplace
 */
const createBoard = async (data) => {
	if (!data.name || data.name === "") throw new Error("Name is required");
	if (!data.author) throw new Error("Author is required");
	if (!data.width || !(data.width % 16 === 0)) throw new Error("Width must be a multiple of 16");
	if (!data.height || !(data.height % 16 === 0)) throw new Error("Height must be a multiple of 16");
	if (!data.placementDelay || data.placementDelay < 0) throw new Error("Placement delay is required");
	/*
	 * Ending date est optionnel mais si elle est set on ajoute sa valeur en jour : now + endingDate
	 */
	const board = new PixelBoard({
		name: data.name,
		author: data.author,
		width: data.width,
		height: data.height,
		chunkSize: 16,
		placementDelay: data.placementDelay,
		status: 'creating',
		endingDate: data.endingDate ? new Date(new Date().getTime() + data.endingDate * 24 * 60 * 60 * 1000) : null,
		chunks: []
	});

	await board.save();

	const chunksX = data.width / 16;
	const chunksY = data.height / 16;
	const bulkOps = [];
	for (let i = 0; i < chunksX; i++) {
		for (let j = 0; j < chunksY; j++) {
			bulkOps.push({
				insertOne: {
					document: {
						x: i * 16,
						y: j * 16,
						boardId: board._id,
						data: Buffer.alloc(128, 0), // 16x16 pixels, 4 bits par pixel
						lastUpdated: new Date()
					}
				}
			});
		}
	}

	if (bulkOps.length > 0) {
		await Chunk.bulkWrite(bulkOps);
	}

	const chunks = await Chunk.find({ boardId: board._id }, '_id', { lean: true });
	board.chunks = chunks.map(chunk => chunk._id);
	board.status = 'active';
	await board.save();

	return board;
};

const deleteBoard = async (boardId) => {
	try {
		const board = await PixelBoard.findById(boardId);
		if (!board) throw new Error("Board not found");

		const chunksResult = await Chunk.deleteMany({ boardId });
		const modsResult = await PixelModification.deleteMany({ boardId });
		await PixelBoard.deleteOne({ _id: boardId });

		console.log(`${chunksResult.deletedCount} chunks deleted`);
		console.log(`${modsResult.deletedCount} modifications deleted`);
		console.log(`Board ${board.name} - ${boardId} deleted`);

		return {
			success: true,
			deletedBoard: board.name,
			deletedChunks: chunksResult.deletedCount,
			deletedModifications: modsResult.deletedCount
		};
	} catch (error) {
		console.error(`Error while deleting ${boardId}:`, error);
		throw error;
	}
};

/**
 * Récupère le temps restant pour un board
 * @param boardId
 * @returns {Promise<{timeleft: {days: number, hours: number, minutes: number}, status: string}>}
 */
const boardTimeLeft = async (boardId) => {
	try {
		const board = await PixelBoard.findById(boardId);
		if (!board) throw new Error("Board not found");

		if (board.endingDate == null){
			return {
				timeleft : "Infinite",
				status: board.status
			};
		}
		const now = new Date();
		const timeLeft = board.endingDate - now;

		if (timeLeft <= 0) {
			console.log(`Board ${boardId} is finished`);
			board.status = 'finished';
			await board.save();
		}

		return {
			timeleft : {
				days: Math.floor(timeLeft / (24 * 60 * 60 * 1000)),
				hours: Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
				minutes: Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))
			},
			status: board.status
		};

	} catch (error) {
		console.error(`Error while getting time left ${boardId}:`, error);
		throw error;
	}
};
/**
 * Met à jour un PixelBoard existant avec de nouvelles données.
 * Gère le redimensionnement en créant/supprimant des chunks au besoin.
 * @param {string} boardId - ID du board à modifier
 * @param {Object} data - Nouvelles données (name, width, height, placementDelay, status, endingDate)
 * @returns {Promise<Object>} - Le board modifié
 */
const updateBoard = async (boardId, data) => {
	try {
		// Récupérer le board existant
		const board = await PixelBoard.findById(boardId);
		if (!board) throw new Error("Board not found");

		// Vérifier si le board est en cours d'utilisation
		if (board.status === 'finished') {
			throw new Error("Cannot modify a finished board");
		}

		// Sauvegarde des dimensions actuelles pour comparaison
		const originalWidth = board.width;
		const originalHeight = board.height;

		// Mise à jour des propriétés de base
		if (data.name) board.name = data.name;
		if (data.placementDelay !== undefined && data.placementDelay >= 0) board.placementDelay = data.placementDelay;
		if (data.status && ['active', 'non-active'].includes(data.status)) {
			board.status = data.status;
		}

		// Gestion de la date de fin
		if (Object.prototype.hasOwnProperty.call(data, 'endingDate')) {
			if (data.endingDate === null) {
				board.endingDate = null;
			} else if (typeof data.endingDate === 'number' && data.endingDate >= 0) {
				board.endingDate = new Date(new Date().getTime() + data.endingDate * 24 * 60 * 60 * 1000);
			}
		}

		// Validation de la nouvelle taille
		if (data.width) {
			if (!(data.width % 16 === 0)) throw new Error("Width must be a multiple of 16");
			board.width = data.width;
		}

		if (data.height) {
			if (!(data.height % 16 === 0)) throw new Error("Height must be a multiple of 16");
			board.height = data.height;
		}

		// Appliquer les changements de base du board d'abord
		await board.save();

		// Gestion du redimensionnement si nécessaire
		if ((data.width && data.width !== originalWidth) || (data.height && data.height !== originalHeight)) {
			console.log(`Resizing board from ${originalWidth}x${originalHeight} to ${board.width}x${board.height}`);
			await resizeBoard(board, originalWidth, originalHeight);
		}

		return board;
	} catch (error) {
		console.error(`Error while updating board ${boardId}:`, error);
		throw error;
	}
};

/**
 * Redimensionne un board en ajoutant ou supprimant des chunks.
 * @param {Object} board - Le board à redimensionner
 * @param {number} originalWidth - Largeur originale
 * @param {number} originalHeight - Hauteur originale
 * @returns {Promise<void>}
 */
const resizeBoard = async (board, originalWidth, originalHeight) => {
	const chunkSize = 16;

	// Calculer les dimensions en chunks
	const newChunksX = board.width / chunkSize;
	const newChunksY = board.height / chunkSize;
	const oldChunksX = originalWidth / chunkSize;
	const oldChunksY = originalHeight / chunkSize;

	// 1. Supprimer les chunks qui ne sont plus nécessaires
	if (newChunksX < oldChunksX || newChunksY < oldChunksY) {
		await Chunk.deleteMany({
			boardId: board._id,
			$or: [
				{ x: { $gte: newChunksX * chunkSize } },
				{ y: { $gte: newChunksY * chunkSize } }
			]
		});
	}

	// 2. Ajouter de nouveaux chunks si nécessaire
	const bulkOps = [];

	// Parcourir toutes les positions où des chunks pourraient être nécessaires
	for (let i = 0; i < newChunksX; i++) {
		for (let j = 0; j < newChunksY; j++) {
			const chunkX = i * chunkSize;
			const chunkY = j * chunkSize;

			// Vérifier si ce chunk est dans la zone nouvellement ajoutée
			if (chunkX >= oldChunksX * chunkSize || chunkY >= oldChunksY * chunkSize) {
				bulkOps.push({
					insertOne: {
						document: {
							x: chunkX,
							y: chunkY,
							boardId: board._id,
							data: Buffer.alloc(128, 0), // 16x16 pixels, 4 bits par pixel
							lastUpdated: new Date()
						}
					}
				});
			}
		}
	}

	// Exécuter les opérations d'ajout en lot si nécessaire
	if (bulkOps.length > 0) {
		await Chunk.bulkWrite(bulkOps);
	}

	// 3. Mettre à jour la liste des chunks dans le board
	const chunks = await Chunk.find({ boardId: board._id }, '_id', { lean: true });
	board.chunks = chunks.map(chunk => chunk._id);

	await board.save();
};
module.exports = { getAllBoards, getBoard, createBoard, getRegion, getChunk, updatePixel,deleteBoard,boardTimeLeft,updateBoard };
