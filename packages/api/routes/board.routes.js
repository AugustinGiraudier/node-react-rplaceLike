const express = require('express');
const { getBoards, getBoard, checkPlacementDelay, createBoard,getChunk,getRegion,updatePixel,deleteBoard,boardTimeLeft,updateBoard, getUserOfLastPixelPlaced} = require('../controllers/PixelBoardController');
const { getHeatmap } = require('../controllers/HeatMapController');
const { getReplay } = require('../controllers/ReplayController');
const {mustBeAdmin, mustBeAuthentified} = require("../middlewares/auth");

const router = express.Router();

router.get('/', getBoards);
router.get('/:boardId', getBoard);
router.get('/:boardId/placementDelay', mustBeAuthentified, checkPlacementDelay);
router.post('/', mustBeAuthentified, mustBeAdmin, createBoard);
router.get('/region/:boardId/:startX/:startY/:width/:height', getRegion);
router.get('/chunk/:boardId/:pixelX/:pixelY', getChunk);
router.post('/update', mustBeAuthentified, updatePixel);
router.delete('/:boardId',mustBeAuthentified, mustBeAdmin, deleteBoard);
router.post('/timeleft', boardTimeLeft);
router.put('/:boardId', mustBeAuthentified, mustBeAdmin, updateBoard);
router.get("/:boardId/heatmap", getHeatmap);
router.get("/:boardId/replay", getReplay);
router.get("/lastpixel/:boardId/:pixelX/:pixelY", getUserOfLastPixelPlaced);

module.exports = router;
