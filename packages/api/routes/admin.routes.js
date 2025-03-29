const {Router} = require("express"); // Déplacer cette ligne en premier
const router = Router();
const { mustBeAuthentified, mustBeAdmin } = require("../middlewares/auth");
const {checkAccess} = require("../controllers/AdminController");

// Protéger toutes les routes admin
router.use(mustBeAuthentified, mustBeAdmin);

router.get("/check-access", checkAccess);


router.get("/pixelboards", (req, res) => {
	res.json([]);
});

module.exports = router;
