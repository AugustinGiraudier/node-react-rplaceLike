const express = require("express");
const {updateUser} = require("../controllers/UserController");
const {getUser, getUsers} = require("../services/UserService");

const router = express.Router();

router.patch("/:id", updateUser);
router.get("/:id", getUser);
router.get("/", getUsers);
module.exports = router;
