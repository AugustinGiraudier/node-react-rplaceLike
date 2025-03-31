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
		const user = req.user;
		if (!user) {
			return res.status(400).json({ message: "User not recognized" });
		}

		const stats = await getUserStats(user);
		res.json(stats);
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch user statistics: " + error.message });
	}
};
