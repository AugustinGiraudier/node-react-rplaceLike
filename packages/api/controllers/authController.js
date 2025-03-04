const User = require("../models/user.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		// Vérifier si l'utilisateur existe déjà
		const userExists = await User.findOne({
			$or: [{ email }, { username }],
		});
		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}

		// Créer un nouvel utilisateur
		const user = await User.create({
			username,
			email,
			password,
		});

		// Générer le token
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

		// Vérifier si l'utilisateur existe
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		// Vérifier le mot de passe
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		// Générer le token
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
