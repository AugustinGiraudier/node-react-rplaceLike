const mongoose = require("mongoose");
const pixelSchema = require("./Pixel");

const chunkSchema = new mongoose.Schema({
	boardId: { type: mongoose.Schema.Types.ObjectId, ref: "PixelBoard", required: true },
	x: { type: Number, required: true },
	y: { type: Number, required: true },
	pixels: [[pixelSchema]],
	lastUpdated: { type: Date, default: Date.now },
});

chunkSchema.index({ boardId: 1, x: 1, y: 1 }, { unique: true });

module.exports = mongoose.model("Chunk", chunkSchema);
