const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const boardRoutes = require("./routes/board.routes");
const authRoutes = require("./routes/auth.routes");
const http = require("http");

const socketInstance = require('./websockets/socket-instance');
const setupSockets = require('./websockets/sockets');
const testRoutes = require("./routes/auth.tests.routes");
const userRoutes = require("./routes/user.routes");
const statsRoutes = require("./routes/stats.routes");
const adminRoutes = require("./routes/admin.routes");
const snapshotRoutes = require("./routes/snapshot.routes");
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8001;

app.use(cors()); //autorise le CORS
app.use(express.json());

// custom routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/stats", statsRoutes);
app.use('/boards', boardRoutes);
app.use('/admin', adminRoutes);
app.use('/snapshot', snapshotRoutes);
/* ---- TESTS Auth and Admin perms ---- */
app.use('/tests', testRoutes);
/* ------------------------------------ */

const io = socketInstance.init(server);
setupSockets(io);

server.listen(port, () => {
	console.log(`🚀 Server running on port ${port}`);
});



