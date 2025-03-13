const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const boardRoutes = require("./routes/board.routes");
const authRoutes = require("./routes/auth.routes");
const http = require("http");

const socketInstance = require('./websockets/socket-instance');
const setupSockets = require('./websockets/sockets');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const port = 8001;

app.use(cors()); //autorise le CORS
app.use(express.json());

// custom routes
app.use('/api/boards', boardRoutes);
app.use('/api/auth', authRoutes);

const io = socketInstance.init(server);
setupSockets(io);

server.listen(port, () => {
	console.log(`Server listening on ${port}`);
});



