const {getStats} = require("../services/statsService");

exports.getStats = async (req, res) => {
	try {
		const stats = await getStats();
		res.json(stats);
	} catch (error) {
		res.status(500).json({message: "Failed to fetch statistics"});
	}
};
