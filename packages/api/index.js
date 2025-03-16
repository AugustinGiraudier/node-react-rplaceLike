const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const statsRoutes = require("./routes/statsRoutes");

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Hello World"));

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/stats", statsRoutes);

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
