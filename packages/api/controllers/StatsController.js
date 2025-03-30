const {getStats,getUserStats} = require("../services/StatsService");

exports.getStats = async (req, res) => {
	try {
		const stats = await getStats();
		res.json(stats);
	} catch (error) {
		res.status(500).json({message: "Failed to fetch statistics : " + error});
	}
};

exports.getUserStats = async (req, res) => {
	try {
		const userId = req.params.userId;
		if (!userId) {
			return res.status(400).json({ message: "User ID is required" });
		}

		const stats = await getUserStats(userId);
		res.json(stats);
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch user statistics: " + error.message });
	}
};
