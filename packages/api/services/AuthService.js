const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const registerUser = async (username, email, password) => {
    const userExists = await User.findOne({$or: [{email}, {username}]});
    if (userExists) throw new Error("User already exists");

    const user = await User.create({username, email, password});

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    return {user, token};
};

const loginUser = async (email, password) => {
    const user = await User.findOne({email});
    if (!user) throw new Error("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    return {user, token};
};

module.exports = {registerUser, loginUser};
