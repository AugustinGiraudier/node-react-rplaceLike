const PixelModification = require("../models/PixelModification");

/**
* Récupère toutes les modifications liées à un boardId et ajoute un timestamp relatif
* normalisé entre 0 et 1 (0 pour la première modification, 1 pour la dernière)
* @param {string|mongoose.Types.ObjectId} boardId - L'identifiant du tableau
* @returns {Promise<Array>} Une promesse qui résout avec un tableau de modifications augmentées
*/
async function getReplayData(boardId) {
    try {
        
        // Récupérer toutes les modifications pour ce tableau
        const modifications = await PixelModification.find({ boardId })
        // Tri par ordre chronologique (du plus ancien au plus récent)
        .sort({ timestamp: 1 })
        .exec();
        
        if (modifications.length === 0) {
            return [];
        }
        
        // Si une seule modification existe, elle aura une valeur relative de 0
        if (modifications.length === 1) {
            const modificationObject = modifications[0].toObject();
            modificationObject.relativeTimeNormalized = 0;
            return [modificationObject];
        }
        
        // Récupérer le timestamp de la première et de la dernière modification
        const firstModificationTime = modifications[0].timestamp.getTime();
        const lastModificationTime = modifications[modifications.length - 1].timestamp.getTime();
        
        // Calculer la durée totale
        const totalDuration = lastModificationTime - firstModificationTime;
        
        // Ajouter le temps relatif normalisé à chaque modification
        const modificationsWithNormalizedTime = modifications.map(modification => {
            const currentTimestamp = modification.timestamp.getTime();
            
            // Calculer la valeur normalisée entre 0 et 1
            // Si totalDuration est 0 (toutes les modifications ont le même timestamp),
            // on attribue une valeur basée sur l'index dans le tableau
            let normalizedTime;
            if (totalDuration === 0) {
                const index = modifications.indexOf(modification);
                normalizedTime = index / (modifications.length - 1);
            } else {
                normalizedTime = (currentTimestamp - firstModificationTime) / totalDuration;
            }
            
            // Convertir en document JavaScript normal au lieu d'un document Mongoose
            const modificationObject = modification.toObject();
            
            // Ajouter la propriété de temps normalisé
            modificationObject.relativeTimeNormalized = normalizedTime;
            
            return modificationObject;
        });
        
        return modificationsWithNormalizedTime;
    } catch (error) {
        console.error('Erreur lors de la récupération des modifications avec temps normalisé:', error);
        throw error;
    }
}

module.exports = {
    getReplayData
};