const {registerUser, loginUser} = require("../services/AuthService");

exports.register = async (req, res) => {
	try {
		const {username, email, password} = req.body;
		if (!username || !email || !password) {
			return res.status(400).json({message: "All fields are required"});
		}
		const {user, token} = await registerUser(username, email, password);
		res.status(201).json({
			success: true,
			token,
			user: {id: user._id, username: user.username, email: user.email},
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

exports.login = async (req, res) => {
	try {
		const {email, password} = req.body;
		if (!email || !password) {
			return res.status(400).json({message: "All fields are required"});
		}
		const {user, token} = await loginUser(email, password);
		res.json({
			success: true,
			token,
			user: {id: user._id, username: user.username, email: user.email},
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};
