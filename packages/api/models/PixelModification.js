const mongoose = require('mongoose');

const pixelModificationSchema = new mongoose.Schema({
	boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'PixelBoard', required: true },
	x: { type: Number, required: true },
	y: { type: Number, required: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	timestamp: { type: Date, default: Date.now },
});

// Index unique pour ne garder qu'une entrée par pixel
pixelModificationSchema.index({ boardId: 1, x: 1, y: 1 }, { unique: true });

module.exports = mongoose.model('PixelModification', pixelModificationSchema);
