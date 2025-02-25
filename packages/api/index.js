const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

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
