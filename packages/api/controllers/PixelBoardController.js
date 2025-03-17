const BoardService = require('../services/PixelBoardService');

exports.getBoards = async (req, res) => {
	try {
		const users = await BoardService.getAllBoards();
		res.json(users);
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

exports.deleteBoard = async (req, res) => {
	try {
		const { boardId } = req.body;
		const deleted = await BoardService.deleteBoard(boardId);
		res.json(deleted);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};

exports.boardTimeLeft = async (req, res) => {
	try {
		const { boardId } = req.body;
		const timeLeft = await BoardService.boardTimeLeft(boardId);
		res.json(timeLeft);
	} catch (error) {
		res.status(500).json({ message: 'Server error : ' + error });
	}
};
