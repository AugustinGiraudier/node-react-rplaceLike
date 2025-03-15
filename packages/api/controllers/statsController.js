const User = require("../models/user.js");

exports.getStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();

        const boardCount = 0;	// A définir quand on aura le schéma PixelBoard

        res.json({
            userCount,
            boardCount
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Failed to fetch statistics" });
    }
};
