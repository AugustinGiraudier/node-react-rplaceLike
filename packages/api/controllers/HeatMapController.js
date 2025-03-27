const HeatMapService = require('../services/HeatMapService');

exports.getHeatmap = async (req, res) => {
    try {
		const { boardId } = req.params;
        const heatMap = await HeatMapService.getOrGenerateHeatmap(boardId);
        res.json(heatMap);
    } catch (error) {
        res.status(500).json({ message: 'Server error : ' + error });
    }
};