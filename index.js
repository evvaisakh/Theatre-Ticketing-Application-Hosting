const express = require('express');
const app = express();

const morgan = require('morgan');
app.use(morgan('dev'));

const cors = require('cors');
app.use(cors());

const PORT = 3000;

const api = require('./routes/router');
app.use('/ticketMaster', api);

const db = require('./db/connection');
require('dotenv').config();

const path =require('path');

app.use(express.static(path.join(__dirname,'frontend')))

app.get('*',async(req,res)=>{
    res.sendFile(path.join(__dirname,'frontend','index.html'))
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});