const express = require("express");
const {getStats,getUserStats} = require("../controllers/StatsController");

const router = express.Router();

router.get("/", getStats);
router.get("/user/:userId", getUserStats);

module.exports = router;
