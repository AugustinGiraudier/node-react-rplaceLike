const User = require("../models/User");
const bcrypt = require("bcryptjs");

const updateUser = async (id, updates) => {
    const user = await User.findById(id);
    if (!user) throw new Error("User not found");

    if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
    });

    return updatedUser;
};

const getUser = async (id) => {
	const user = await User.findById(id);
	if (!user) throw new Error("User not found");

	return user;
};

const getUsers = async () => {
	const users = await User.find();
	return users;
};
const addUserPixel = async (user) => {
	// increment pixel count
	if (!user) throw new Error("User not found");

	user.pixelsPlaced += 1;
	await user.save();
	return user;
};
module.exports = {updateUser,getUser,getUsers,addUserPixel};
