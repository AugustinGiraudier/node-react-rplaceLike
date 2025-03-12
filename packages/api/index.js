const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const boardRoutes = require("./routes/board.routes");
const authRoutes = require("./routes/auth.routes");
const testRoutes = require("./routes/auth.tests.routes");

dotenv.config();
connectDB();

const app = express();
const port = 8001;

app.use(cors()); //autorise le CORS
app.use(express.json());

// custom routes
app.use('/api/boards', boardRoutes);
app.use('/api/auth', authRoutes);


/* ---- TESTS Auth and Admin perms ---- */
app.use('/tests', testRoutes);
/* ------------------------------------ */


app.listen(port, () => {
	console.log(`Server listening on ${port}`);
});


	
