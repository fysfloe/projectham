/**
 * Module dependencies.
 */

var express = require('express'),
    logger = require('morgan'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    favicon = require('serve-favicon'),
    cookieParser = require('cookie-parser'),
    errorHandler = require('errorhandler');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

// all environments
//app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('origins', 'http://localhost:*');
app.set('view engine', 'jade');

// Add headers
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(methodOverride());
//app.use(cookieParser('your secret here'));
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
//app.use(session({ resave: true, saveUninitialized: true, secret: 'very-secret' }));
// development only
if ('development' == app.get('env')) {
	app.use(errorHandler());
}

// Routes
app.get('/', routes.index);

module.exports = app;