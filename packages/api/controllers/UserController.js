const {updateUser} = require("../services/UserService");

exports.updateUser = async (req, res) => {
    try {
        const {id} = req.params;
        const updates = req.body;

        const user = await updateUser(id, updates);

        res.json({success: true, user});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};
