const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const { register, login } = require("./controllers/authController");

dotenv.config();
connectDB();

const app = express();
const port = 8000;

app.use(cors()); //autorise le CORS
app.use(express.json());

// use App middlewares

app.listen(port, () => {
	console.log(`Server listening on ${port}`);
});

app.get("/", (req, res) => {
	res.send("Hello World");
});

app.post("/register", register);
app.post("/login", login);
