const ReplayService = require('../services/ReplayService');

exports.getReplay = async (req, res) => {
    try {
		const { boardId } = req.params;
        const replay = await ReplayService.getReplayData(boardId);
        res.json(replay);
    } catch (error) {
        res.status(500).json({ message: 'Server error : ' + error });
    }
};
