const User = require("../models/User");

const getStats = async () => {
    const userCount = await User.countDocuments();
    const boardCount = 0; // À définir quand le schéma PixelBoard sera créé

    return {userCount, boardCount};
};

module.exports = {getStats};
