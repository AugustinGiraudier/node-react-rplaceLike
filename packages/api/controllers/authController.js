const User = require("../models/user.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		if (!username || !email || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}

		const userExists = await User.findOne({
			$or: [{ email }, { username }],
		});
		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}

		const user = await User.create({
			username,
			email,
			password,
		});

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "7d",
		});

		res.status(201).json({
			success: true,
			token,
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "7d",
		});

		res.json({
			success: true,
			token,
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (updates.password) {
			updates.password = await bcrypt.hash(updates.password, 10);
		}

		const updatedUser = await User.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
		});

		res.json({
			success: true,
			user: {
				id: updatedUser._id,
				username: updatedUser.username,
				email: updatedUser.email,
				role: updatedUser.role,
				bio: updatedUser.bio,
				profilePicture: updatedUser.profilePicture,
				pixelsPlaced: updatedUser.pixelsPlaced,
				lastPixelPlacedAt: updatedUser.lastPixelPlacedAt,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

