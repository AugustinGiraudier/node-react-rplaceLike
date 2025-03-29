const User = require("../models/User");
const PixelBoard = require("../models/PixelBoard");
const PixelModification = require("../models/PixelModification");
const getStats = async () => {
	const userCount = await User.countDocuments();
	const boardCount = await PixelBoard.countDocuments();
	const pixelCount = await PixelModification.countDocuments();
	// ADD LE RESTE
	return {
		userCount,
		boardCount,
		pixelCount
		// ADD LE RESTE
	};
};

module.exports = {getStats};
