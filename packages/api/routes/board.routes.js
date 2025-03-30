const express = require('express');
const { getBoards, getBoard, createBoard,getChunk,getRegion,updatePixel,deleteBoard,boardTimeLeft,updateBoard } = require('../controllers/PixelBoardController');
const { getHeatmap } = require('../controllers/HeatMapController');
const { mustBeFinished } = require("../middlewares/board");
const {mustBeAdmin, mustBeAuthentified} = require("../middlewares/auth");

const router = express.Router();

router.get('/', getBoards);
router.get('/:boardId', getBoard);
router.post('/', createBoard);
router.get('/region/:boardId/:startX/:startY/:width/:height', getRegion);
router.get('/chunk/:boardId/:pixelX/:pixelY', getChunk);
router.post('/update', updatePixel);
router.delete('/:boardId',mustBeAuthentified,mustBeAdmin, deleteBoard);
router.post('/timeleft', boardTimeLeft);
router.put('/:boardId', mustBeAuthentified, mustBeAdmin, updateBoard);
router.get("/:boardId/heatmap", mustBeFinished, getHeatmap);
module.exports = router;
