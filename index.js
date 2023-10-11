const express = require('express');
const app = express();

const morgan = require('morgan');
app.use(morgan('dev'));

const cors = require('cors');
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;
const path = require('path');

const api = require('./routes/router');
app.use('/api', api);

const db = require('./db/connection');
require('dotenv').config();

app.use(express.static(path.join(__dirname, 'frontend')));

app.get('*', async (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});