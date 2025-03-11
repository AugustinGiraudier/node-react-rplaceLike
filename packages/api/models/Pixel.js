const mongoose = require('mongoose');

const pixelSchema = new mongoose.Schema({
	color: { type: String, required: true, default: '#FFFFFF' },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
	timestamp: { type: Date, default: null }
}, { _id: false }); // Pas besoin d'ID pour chaque pixel individuel

module.exports = mongoose.model("Pixel", pixelSchema);
