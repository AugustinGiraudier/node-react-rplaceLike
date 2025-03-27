const express = require('express');
const { getBoards, getBoard, createBoard,getChunk,getRegion,updatePixel,deleteBoard,boardTimeLeft } = require('../controllers/PixelBoardController');
const { getHeatmap } = require('../controllers/HeatMapController');
const { mustBeFinished } = require("../middlewares/board");

const router = express.Router();

router.get('/', getBoards);
router.get('/:boardId', getBoard);
router.post('/', createBoard);
router.get('/region/:boardId/:startX/:startY/:width/:height', getRegion);
router.get('/chunk/:boardId/:pixelX/:pixelY', getChunk);
router.post('/update', updatePixel);
router.delete('/:boardId', deleteBoard);
router.get('/timeleft', boardTimeLeft);

router.get("/:boardId/heatmap", mustBeFinished, getHeatmap);
module.exports = router;