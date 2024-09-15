require('dotenv').config();
const client = require('./config/db');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const cors = require('cors');
app.use(cors({ origin: 'http://localhost:3001' }));

// Use body-parser to parse JSON bodies into JS objects
app.use(bodyParser.json());

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
