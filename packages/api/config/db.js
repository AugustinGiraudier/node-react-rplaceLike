const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {

console.log("URI de connexion:", process.env.MONGO_URI);


	try {
		await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("✅ MongoDB connectée !");
	} catch (error) {
		console.error("❌ Erreur de connexion à MongoDB", error);
		process.exit(1);
	}
};

module.exports = connectDB;
