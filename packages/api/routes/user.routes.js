const express = require("express");
const {updateUser} = require("../controllers/userController");
const {getUser, getUsers} = require("../services/UserService");

const router = express.Router();

router.patch("/:id", updateUser);
router.get("/:id", getUser);
router.get("/", getUsers);
module.exports = router;
