const mongoose = require('mongoose');
const PixelModification = require("../models/PixelModification");
const BoardHeatMap = require("../models/BoardHeatMap");

// Fonction pour générer et sauvegarder la heatmap
const generateAndSaveHeatmap = async (boardId) => {
    try {
        const boardObjectId = new mongoose.Types.ObjectId(boardId);

        const modificationStats = await PixelModification.aggregate([
            { $match: { boardId: boardObjectId } },
            {
                $group: {
                    _id: {
                        x: '$x',
                        y: '$y'
                    },
                    modificationCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    // Transformer l'objet _id en champs x et y
                    x: '$_id.x',
                    y: '$_id.y',
                    modificationCount: 1,
                    // Supprimer le champ _id du résultat
                    _id: 0
                }
            }
        ]);

        // Trouver le nombre maximum de modifications pour un pixel
        const maxModificationsPerPixel = Math.max(
            ...modificationStats.map(item => item.modificationCount),
            0  // Valeur par défaut si la liste est vide
        );

        const heatmap = new BoardHeatMap({
            boardId: boardObjectId,
            heatmapData: modificationStats,
            totalModifications: modificationStats.reduce((sum, item) => sum + item.modificationCount, 0),
            maxModifications: maxModificationsPerPixel
        });

        await heatmap.save();

        return heatmap;
    } catch (error) {
        console.error('Erreur lors de la génération de la heatmap:', error);
        throw error;
    }
};

// Fonction pour récupérer la dernière heatmap
const getLatestHeatmap = async (boardId) => {
    return BoardHeatMap.findOne({ boardId })
        .sort({ generatedAt: -1 })
        .limit(1);
};

// Fonction pour récupérer ou générer la heatmap
const getOrGenerateHeatmap = async (boardId, forceRegenerate = false) => {
    if (forceRegenerate) {
        return generateAndSaveHeatmap(boardId);
    }

    // Chercher la heatmap la plus récente
    const existingHeatmap = await getLatestHeatmap(boardId);

    // Si la heatmap existe et n'a pas plus de 24h
    if (existingHeatmap && 
        (new Date() - existingHeatmap.generatedAt) < 24 * 60 * 60 * 1000) {
        return existingHeatmap;
    }

    // Générer une nouvelle heatmap
    return generateAndSaveHeatmap(boardId);
};

module.exports = {
    generateAndSaveHeatmap,
    getLatestHeatmap,
    getOrGenerateHeatmap
};