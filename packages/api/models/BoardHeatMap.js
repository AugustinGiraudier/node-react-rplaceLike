const mongoose = require('mongoose');

const pixelHeatmapSchema = new mongoose.Schema({
    boardId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'PixelBoard', 
        required: true 
    },
    generatedAt: {
        type: Date, 
        default: Date.now 
    },
    heatmapData: [{
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        modificationCount: { type: Number, required: true }
    }],
    totalModifications: { type: Number, default: 0 },
    maxModifications:  { type: Number, default: 0 }
});

// Index pour la recherche rapide
pixelHeatmapSchema.index({ boardId: 1, generatedAt: -1 });

module.exports = mongoose.model('PixelHeatmap', pixelHeatmapSchema);