const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.connection_string, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log(`Connection to Database established`);
    })
    .catch((error) => {
        console.log(`Error in connecting to database ${error.message}`);
    });