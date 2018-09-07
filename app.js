// jshint esversion : 6

var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var mongoose = require('mongoose');
var passport = require('passport');
var path = require('path');

var users = require('./route/users');

// MongoDB IBMCloud Configuration
var mongoDbUrl, mongoDbOptions = {};
cfenv = require('cfenv');
appEnv = cfenv.getAppEnv();
var mongoDbCredentials = appEnv.services["compose-for-mongodb"][0].credentials;
mongoDbUrl = mongoDbCredentials.uri;
mongoDbOptions = 
{
  mongos: {
    ssl: true,
    sslValidate: true,
    poolSize: 1,
    reconnectTries: 1
  }
};

if (mongoDbCredentials.hasOwnProperty("ca_certificate_base64")) {
  let ca = [new Buffer(mongoDbCredentials.ca_certificate_base64, 'base64')];
  mongoDbOptions.mongos.sslCA = ca;
}

// Express Cloud Configuration
var app = express();
var port = appEnv.port || 8080;
app.enable('trust proxy');
app.use(
	(req, res, next) => {
        if (req.secure)
            next();
        else
            res.redirect('https://' + req.headers.host + req.url);
  }
);

// MongoDB Connection
mongoose.connect(mongoDbUrl, mongoDbOptions);
mongoose.connection.on('connected', () => {
	console.log('Connected to mongodb '+ mongoDbUrl);
});
mongoose.connection.on('error', (err) => {
	console.log('Error Connecting to mongo '+ mongoDbUrl);
	console.log(err);
});

// Add Passport Code
app.use(passport.initialize());
app.use(passport.session());
require('./config/passportjwt');

// Static Pages /public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// CORS
app.use(cors(
	{
		origin: ['http://127.0.0.1:4200', 'http://localhost:4200'],
		credentials: true
	}
));

// Users route
app.use('/users',users);

app.use('*', (req, res) => {
	res.status(401).json({message: 'URL Not found '});
});

app.listen(port, appEnv.bind, () => {
	console.log('Started server using port no '+appEnv.url);
});