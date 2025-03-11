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
