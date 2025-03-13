const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema({
	x: { type: Number, required: true },
	y: { type: Number, required: true },
	// Référence au board parent
	boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'PixelBoard', required: true },
	// Array binaires pour stocker les pixels, même méthode que https://redditinc.com/blog/how-we-built-rplace
	data: { type: Buffer, required: true },
	lastUpdated: { type: Date, default: Date.now },
});

// Index unique pour garantir qu'il n'y a pas de doublons
chunkSchema.index({ boardId: 1, x: 1, y: 1 }, { unique: true });

module.exports = mongoose.model("Chunk", chunkSchema);
