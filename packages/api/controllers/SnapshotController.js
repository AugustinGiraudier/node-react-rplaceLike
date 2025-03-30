
const SnapshotService = require('../services/SnapshotService');

exports.getSnapshot = async (req, res) => {
	try {
		const { boardId } = req.params;

		const snapshotData = await SnapshotService.getSnapshot(boardId);

		if (!snapshotData || !snapshotData.snapshot) {
			return res.status(404).json({ success: false, message: 'Snapshot not found' });
		}

		const base64Data = snapshotData.snapshot;
		const mimeType = snapshotData.mimeType || 'image/png';

		res.setHeader('Content-Type', mimeType);
		res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
		res.setHeader('Pragma', 'no-cache');
		res.setHeader('Expires', '0');
		res.setHeader('Surrogate-Control', 'no-store');

		const imageBuffer = Buffer.from(base64Data, 'base64');
		res.send(imageBuffer);
	} catch (error) {
		console.error('Error getting snapshot:', error);
		res.status(500).json({ success: false, message: 'Server error: ' + error.message });
	}
};

exports.getSnapshotDataUrl = async (req, res) => {
	try {
		const { boardId } = req.params;

		const snapshotData = await SnapshotService.getSnapshot(boardId);

		if (!snapshotData || !snapshotData.snapshot) {
			return res.status(404).json({ success: false, message: 'Snapshot not found' });
		}

		const mimeType = snapshotData.mimeType || 'image/png';
		const dataUrl = `data:${mimeType};base64,${snapshotData.snapshot}`;

		res.json({
			success: true,
			dataUrl,
			lastUpdated: snapshotData.lastUpdated
		});
	} catch (error) {
		console.error('Error getting snapshot data URL:', error);
		res.status(500).json({ success: false, message: 'Server error: ' + error.message });
	}
};

exports.regenerateSnapshot = async (req, res) => {
	try {
		const { boardId } = req.params;

		const result = await SnapshotService.generateSnapshot(boardId, true);

		res.json({
			success: true,
			message: 'Snapshot regenerated successfully',
			result,
			cacheKey: Date.now()
		});
	} catch (error) {
		console.error('Error regenerating snapshot:', error);
		res.status(500).json({ success: false, message: 'Server error: ' + error.message });
	}
};

exports.regenerateAllSnapshots = async (req, res) => {
	try {
		const results = await SnapshotService.regenerateAllSnapshots();

		res.json({
			success: true,
			message: 'Regeneration process completed',
			results
		});
	} catch (error) {
		console.error('Error regenerating all snapshots:', error);
		res.status(500).json({ success: false, message: 'Server error: ' + error.message });
	}
};
