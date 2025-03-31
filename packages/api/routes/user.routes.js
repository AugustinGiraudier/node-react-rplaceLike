const express = require("express");
const {updateUser} = require("../controllers/userController");
const {getUser, getUsers} = require("../services/UserService");


const { mustBeAuthentified } = require("../middlewares/auth");

const router = express.Router();

router.patch("/", mustBeAuthentified, updateUser);
router.get("/:id", getUser);
router.get("/", getUsers);
module.exports = router;
