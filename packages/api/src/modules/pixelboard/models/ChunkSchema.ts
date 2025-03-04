import mongoose from 'mongoose';
import pixelSchema from "./PixelSchema";

const chunkSchema = new mongoose.Schema({
	boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'PixelBoard', required: true },
	x: { type: Number, required: true },
	y: { type: Number, required: true },
	pixels: [[pixelSchema]],
	lastUpdated: { type: Date, default: Date.now }
});

// Index composé pour récupérer rapidement un chunk par boardId et position
chunkSchema.index({ boardId: 1, x: 1, y: 1 }, { unique: true });

export default mongoose.model('Chunk', chunkSchema);
