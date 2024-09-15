const express = require('express');
const app = express();
const port = 3000;

// Import the user routes
const userRoutes = require('./routes/userRoutes');

// Use the user routes
app.use('/api/users', userRoutes);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.send('Hello, STAAN!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'staan',
    password: '@StayAwake1',
    port: 5432,
});

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

app.get('/users', (req, res) => {
    client.query('SELECT NOW()', (err, result) => {
        if (err) {
            res.send(err.stack);
        } else {
            res.send(result.rows[0]);
        }
    });
});
