// Ajoutez ces routes à votre fichier de routes

const SnapshotController = require('../controllers/SnapshotController');

const express = require('express');
const router = express.Router();

// Routes pour les snapshots
router.get('/board/:boardId/snapshot', SnapshotController.getSnapshot);
router.get('/board/:boardId/snapshot/dataurl', SnapshotController.getSnapshotDataUrl);
router.post('/board/:boardId/snapshot/regenerate', SnapshotController.regenerateSnapshot);
router.post('/board/snapshots/regenerate-all', SnapshotController.regenerateAllSnapshots);

module.exports = router;
