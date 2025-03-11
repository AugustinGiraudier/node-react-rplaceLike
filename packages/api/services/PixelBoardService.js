const PixelBoard = require("../models/PixelBoard");

const getAllBoards = async () => {
	return PixelBoard.find() || null;
};

const createBoard = async (data) => {
	return await PixelBoard.create(data);
};

module.exports = { getAllBoards, createBoard };
