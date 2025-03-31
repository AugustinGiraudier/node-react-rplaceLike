const express = require("express");
const {getStats,getUserStats} = require("../controllers/StatsController");
const { mustBeAuthentified } = require("../middlewares/auth");

const router = express.Router();

router.get("/", getStats);
router.get("/user", mustBeAuthentified, getUserStats);

module.exports = router;
