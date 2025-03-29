const express = require("express");
const {getStats} = require("../controllers/StatsController");

const router = express.Router();

router.get("/", getStats);

module.exports = router;
