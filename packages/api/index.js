const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const api = require('./api');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const port = 8000;

app.use(cors()); //autorise le CORS
app.use(express.json());

app.get('/', (req, res) => { // GET SUR localhost:8000/
	res.json('Hello World!');
});

app.use('/api', api);

app.listen(port, () => {
	console.log(`Server listening on ${port}`);
});
