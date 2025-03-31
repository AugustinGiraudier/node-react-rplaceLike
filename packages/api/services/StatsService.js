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

const getUserStats = async (user) => {
	if (!user) {
		throw new Error("User not found");
	}
	const userId = user.id;

	const totalPixelsPlaced = user.pixelsPlaced;
	const userModifications = await PixelModification.find({ userId });
	const boardIds = [...new Set(userModifications.map(mod => mod.boardId.toString()))];


	const boards = await PixelBoard.find({ _id: { $in: boardIds } });


	const boardsActivity = [];
	for (const boardId of boardIds) {
		const board = boards.find(b => b._id.toString() === boardId);
		if (board) {
			const pixelCount = await PixelModification.countDocuments({
				boardId,
				userId
			});

			const lastModification = await PixelModification.findOne({
				boardId,
				userId
			}).sort({ timestamp: -1 });

			boardsActivity.push({
				boardId,
				boardName: board.name,
				pixelsPlaced: pixelCount,
				lastActive: lastModification ? lastModification.timestamp : null
			});
		}
	}

	return {
		totalPixelsPlaced,
		boardsJoined: boardIds.length,
		boardsActivity
	};
};

module.exports = {getStats,getUserStats};
