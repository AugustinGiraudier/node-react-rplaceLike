const PixelBoard = require("../models/PixelBoard");

// checks that the board is currently finished
exports.mustBeFinished = async (req, res, next) => {
  const { boardId } = req.params;
  const board = await PixelBoard.findById(boardId, "status");
  if (board && board.status === "finished") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Unauthorized : board is not finished"
    });
  }
};