const express = require('express');
const { mustBeAuthentified, mustBeAdmin } = require("../middlewares/auth");

const router = express.Router();

router.get("/auth", mustBeAuthentified, async (req, res) => {
    res.status(200).json({"success" : true});
});

router.get("/admin", mustBeAdmin, async (req, res) => {
    res.status(200).json({"success" : true});
});

module.exports = router;