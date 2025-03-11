const BoardService = require('../services/PixelBoardService');

exports.getBoards = async (req, res) => {
	try {
		const users = await BoardService.getAllBoards();
		res.json(users);
	} catch (error) {
		res.status(500).json({ message: 'Erreur serveur ' + error });
	}
};

exports.createBoard = async (req, res) => {
	try {
		const newUser = await BoardService.createBoard(req.body);
		res.status(201).json(newUser);
	} catch (error) {
		res.status(400).json({ message: 'Erreur lors de la création du board ' + error });
	}
};
