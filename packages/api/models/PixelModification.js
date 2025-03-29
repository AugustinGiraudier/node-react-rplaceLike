const mongoose = require('mongoose');

const pixelModificationSchema = new mongoose.Schema({
	boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'PixelBoard', required: true },
	x: { type: Number, required: true },
	y: { type: Number, required: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PixelModification', pixelModificationSchema);
