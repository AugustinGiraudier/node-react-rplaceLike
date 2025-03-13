const express = require('express');
const { getBoards, createBoard,getChunk,getRegion,updatePixel,deleteBoard } = require('../controllers/PixelBoardController');

const router = express.Router();

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/region/:boardId/:startX/:startY/:width/:height', getRegion);
router.get('/chunk/:boardId/:pixelX/:pixelY', getChunk);
router.post('/update', updatePixel);
router.delete('/:boardId', deleteBoard);
module.exports = router;
