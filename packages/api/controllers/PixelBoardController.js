const BoardService = require('../services/PixelBoardService');

exports.getBoards = async (req, res) => {
	try {
		const boards = await BoardService.getAllBoards();
		res.json(boards);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};

exports.checkPlacementDelay = async (req, res) => {
	try {
		const { boardId } = req.params;
		const result = await BoardService.checkPlacementDelay(req.user.id, boardId);
		res.json(result);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};

exports.getBoard = async (req, res) => {
	try {
		const { boardId } = req.params;
		const board = await BoardService.getBoard(boardId);
		res.json(board);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};

exports.createBoard = async (req, res) => {
	try {
		const newUser = await BoardService.createBoard(req.body);
		res.status(201).json(newUser);
	} catch (error) {
		console.log(error);
		res.status(400).json({ message: 'Error when creating the board : ' + error });
	}
};

exports.getRegion = async (req, res) => {
	try {
		const { boardId, startX, startY, width, height } = req.params;
		const region = await BoardService.getRegion(boardId, startX, startY, width, height);
		res.json(region);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};

exports.getChunk = async (req, res) => {
	try {
		const { boardId, pixelX, pixelY } = req.params;
		const chunk = await BoardService.getChunk(boardId, pixelX, pixelY);
		res.json(chunk);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};

exports.updatePixel = async (req, res) => {
	try {
		const { boardId, pixelX, pixelY, color,userId } = req.body;
		const updated = await BoardService.updatePixel(boardId, pixelX, pixelY, color,userId);
		res.json(updated);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};
exports.updateBoard = async (req, res) => {
	try {
		const { boardId } = req.params;
		const updatedBoard = await BoardService.updateBoard(boardId, req.body);
		res.json({
			success: true,
			message: 'Board updated successfully',
			board: updatedBoard
		});
	} catch (error) {
		console.error('Error updating board:', error);
		res.status(400).json({
			success: false,
			message: 'Error updating board: ' + error.message
		});
	}
};
exports.deleteBoard = async (req, res) => {
	console.log(req.params);
	try {
		const { boardId } = req.params;

		const deleted = await BoardService.deleteBoard(boardId);
		res.json(deleted);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};

exports.boardTimeLeft = async (req, res) => {
	try {
		const { boardId } = req.body;
		console.log('boardId', boardId);
		const timeLeft = await BoardService.boardTimeLeft(boardId);
		res.json(timeLeft);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};

exports.getUserOfLastPixelPlaced = async (req, res) => {
	try {
		const { boardId, pixelX, pixelY } = req.params;
		console.log(boardId,pixelX,pixelY);
		const user = await BoardService.getUserOfLastPixelPlaced(boardId, pixelX, pixelY);
		res.json(user);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};
