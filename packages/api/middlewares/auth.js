const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.mustBeAuthentified = async (req, res, next) => {
  try {

    // 1. Vérifier si le token existe
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // 2. Vérifier si le token est valide
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Vérifier si l'utilisateur existe toujours
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // 4. Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }
};

exports.mustBeAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Unauthorized"
    });
  }
};
