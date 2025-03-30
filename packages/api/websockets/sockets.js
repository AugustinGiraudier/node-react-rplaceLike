
const PixelBoardService = require('../services/PixelBoardService');

let ioInstance;

const sockets = (io) => {
	ioInstance = io;

	console.log('Socket server started');

	io.on('connection', (socket) => {
		console.log('User connected:', socket.id);

		socket.on('join-board', async (boardId) => {
			try {
				socket.rooms.forEach(room => {
					if (room.startsWith('board:')) {
						socket.leave(room);
					}
				});

				// Rejoindre la salle du nouveau tableau
				const roomName = `board:${boardId}`;
				socket.join(roomName);
				socket.emit('message', `Joined board ${boardId}`);
				console.log(`User ${socket.id} joined ${roomName}`);

				try {
					// Récupérer les informations du board pour obtenir ses dimensions
					const board = await PixelBoardService.getBoard(boardId);
					if (!board) {
						throw new Error('Board not found');
					}

					console.log(`Loading full board data for board ${boardId} (${board.width}x${board.height})`);

					// Récupérer toutes les données du board au lieu d'une région fixe
					const initialData = await PixelBoardService.getRegion(boardId, 0, 0, board.width, board.height);
					console.log(`Sending board data with ${Object.keys(initialData.pixels || {}).length} pixels`);

					socket.emit('board-data', initialData);
				} catch (error) {
					console.error('Error sending initial board data:', error);
					socket.emit('error', { message: 'Failed to load initial board data' });
				}
			} catch (error) {
				console.error('Error joining board:', error);
				socket.emit('error', { message: error.message });
			}
		});

		// Écouter les placements de pixels
		socket.on('place-pixel', async (data) => {
			try {
				console.log('Pixel placement request:', data);


				if (!data.boardId || data.x === undefined || data.y === undefined || !data.color) {
					throw new Error('Missing required pixel data');
				}

				// Mettre à jour le pixel dans la base de données
				await PixelBoardService.updatePixel(
					data.boardId,
					data.x,
					data.y,
					data.color,
					data.userId
				);

				// Notifier TOUS les clients dans la salle (y compris l'émetteur pour confirmation)
				io.to(`board:${data.boardId}`).emit('pixel-update', {
					x: data.x,
					y: data.y,
					color: data.color
				});
			} catch (error) {
				console.error('Error updating pixel:', error);
				socket.emit('error', { message: error.message });
			}
		});

		// Récupérer une région spécifique du tableau
		socket.on('get-region', async (data) => {
			try {
				const { boardId, x, y, width, height } = data;
				const regionData = await PixelBoardService.getRegion(boardId, x, y, width, height);
				socket.emit('board-data', regionData);
			} catch (error) {
				console.error('Error fetching region:', error);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.id);
		});
	});

	return io;
};

// Fonction utilitaire pour obtenir l'instance io depuis d'autres fichiers
// Note: J'en avais besoin au début mais plus maintenant mais je garde au cas où
//eslint-disable-next-line
const getIO = () => {
	if (!ioInstance) {
		throw new Error('Socket.io not initialized');
	}
	return ioInstance;
};

module.exports = sockets;
// module.exports.getIO = getIO;
