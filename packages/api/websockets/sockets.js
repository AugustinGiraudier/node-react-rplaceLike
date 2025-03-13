
const PixelBoardService = require('../services/PixelBoardService');

// Variable pour stocker l'instance io (accessible dans ce module uniquement)
let ioInstance;

const sockets = (io) => {


	// Stocker l'instance pour pouvoir l'utiliser ailleurs dans ce fichier
	ioInstance = io;

	console.log('Socket server started');

	io.on('connection', (socket) => {
		console.log('User connected:', socket.id);

		// Rejoindre un tableau spécifique
		socket.on('join-board', async (boardId) => {
			try {
				// Quitter les autres salles de tableaux si nécessaire
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

				// Optionnel: envoyer les données initiales du tableau au client
				try {
					// Vous pourriez chercher une région initiale, par exemple 32x32 pixels
					const initialData = await PixelBoardService.getRegion(boardId, 0, 0, 32, 32);
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

				// Valider les données
				if (!data.boardId || data.x === undefined || data.y === undefined || !data.color) {
					throw new Error('Missing required pixel data');
				}

				// Mettre à jour le pixel dans la base de données
				const result = await PixelBoardService.updatePixel(
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

	return io; // Retourner l'instance io
};

// Fonction utilitaire pour obtenir l'instance io depuis d'autres fichiers
// Note: Cette fonction ne sera PAS utilisée car nous avons retiré l'émission d'événements du service
const getIO = () => {
	if (!ioInstance) {
		throw new Error('Socket.io not initialized');
	}
	return ioInstance;
};

module.exports = sockets;
// Exporter aussi getIO si nécessaire plus tard
// module.exports.getIO = getIO;
