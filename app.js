// Importing the necessary modules 
require('dotenv').config(); 
const fs = require('fs'); 
const chalk = require("chalk"); 
const express = require('express'); 
const session = require('express-session'); 
const cors = require('cors'); 
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser'); 
const fileupload = require('express-fileupload');
const mongodbSession = require('connect-mongodb-session')(session);
const path = require('path'); 
const mongodb = require('mongoose');
const morgan = require('morgan'); 

// Setting the database URI 
const databaseURI = "mongodb://127.0.0.1/megaexe"; 

// Connecting to the mongodb database 
mongodb.connect(databaseURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    // On successful connection 
    console.log('Connected to the mongodb database server...'); 
})
// On error in connecting to the mongodb database 
.catch((error) => {
    // On failure 
    console.log("Error connecting to the mongodb database server..."); 
}); 

// Saving the session into mongodb database 
const store = new mongodbSession({
    uri: databaseURI, 
    // collection: 'myNftSessions', 
}); 

// Building the express application 
const app = express(); 

// Loading the hash file into memory
let hashFile = fs.readFileSync(path.join(__dirname, '/hash', 'hashFile.hs')); 
let expressSessionSecret = hashFile.toString().trim(); 

// Setting some necessary middlewares, and creating one 
// week session interval 
const oneWeekSession = 1000 * 60 * 60 * 7*24; 
app.use(session({
    secret: expressSessionSecret, 
    saveUninitialized: true, 
    resave: false, 
    store: store, 
    unset: 'destroy', 
    cookie: { maxAge: oneWeekSession }, 
}));

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(fileupload())
app.use(express.static('static'));
app.use(express.static('./static/javascript'));
app.use(express.static('./static/templates'));
app.use(express.static('./static/css'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Using the envirionment variable for assigning the PORT and the HOST values 
const PORT = process.env.PORT || 5000; 
const HOST = process.env.LocalHostIpAddress || "localhost"; 

// Importing the required routes 
const home = require('./routes/homeRoute'); 

// Setting the route configurations 
app.use('/', home); 


// Running the nodejs server 
app.listen(PORT, HOST, () => {
    // Displaying the server message 
    let serverMessage = chalk.cyan(`The server is running on ${HOST + ":" + PORT}`)
    console.log(serverMessage); 
})