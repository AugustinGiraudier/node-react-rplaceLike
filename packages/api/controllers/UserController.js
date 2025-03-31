const {updateUser, getUser,getUsers} = require("../services/UserService");

exports.updateUser = async (req, res) => {
    try {
        const updates = req.body;

        const user = await updateUser(req.user, updates);

        res.json({success: true, user});
    } catch (error) {
        res.status(500).json({message: "Impossible to update user : " + error});
    }
};

exports.getUser = async (req, res) => {
	try {
		const {id} = req.params;

		const user = await getUser(id);

		res.json({success: true, user});
	} catch (error) {
		res.status(404).json({success: false, message: "Impossible to get user: " + error});
	}
};

exports.getUsers = async (req, res) => {
	try {
		const users = await getUsers();
		res.json({success: true, users});
	} catch (error) {
		res.status(500).json({success: false, message: "Impossible to get users: " + error});
	}
};
