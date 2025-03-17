const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

const boardRoutes = require("./routes/board.routes");
const authRoutes = require("./routes/auth.routes");
const testRoutes = require("./routes/auth.tests.routes");
const userRoutes = require("./routes/user.routes");
const statsRoutes = require("./routes/stats.routes");

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// custom routes :
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/stats", statsRoutes);
app.use('/boards', boardRoutes);

/* ---- TESTS Auth and Admin perms ---- */
app.use('/tests', testRoutes);
/* ------------------------------------ */


app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
