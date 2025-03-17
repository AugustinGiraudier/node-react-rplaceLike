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

module.exports = {updateUser};
