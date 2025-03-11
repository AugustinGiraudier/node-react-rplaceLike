const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const boardRoutes = require("./routes/board.routes");
const authRoutes = require("./routes/auth.routes");

dotenv.config();
connectDB();

const app = express();
const port = 8001;

app.use(cors()); //autorise le CORS
app.use(express.json());

// custom routes
app.use('/api/boards', boardRoutes);
app.use('/api/auth', authRoutes);

app.listen(port, () => {
	console.log(`Server listening on ${port}`);
});



