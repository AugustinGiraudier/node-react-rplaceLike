const mongoose = require('mongoose');

const pixelBoardSchema = new mongoose.Schema({
	name: { type: String, required: true },
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	creationDate: { type: Date, default: Date.now },
	endingDate: { type: Date, default: null },
	status: {
		type: String,
		enum: ['creating', 'active', 'non-active', 'finished'],
		default: 'creating'
	},
	width: { type: Number, required: true },
	height: { type: Number, required: true },
	chunkSize: { type: Number, required: true },
	placementDelay: { type: Number, required: true },
	// Référence aux chunks plutôt que les inclure directement
	chunks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chunk' }]
});

// Index pour la recherche par statut
pixelBoardSchema.index({ status: 1 });
// Index supplémentaire pour trier par date de création (utile pour la page d'accueil)
pixelBoardSchema.index({ status: 1, creationDate: -1 });
// Index pour trier par date de fin (utile pour afficher les boards qui terminent bientôt)
pixelBoardSchema.index({ status: 1, endingDate: 1 });

module.exports = mongoose.model("PixelBoard", pixelBoardSchema);
