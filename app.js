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
var http = require('http');
var path = require('path');

// DB
var monk = require('monk');
var db = monk('localhost:27017/userdb');

// Routes
var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// all environments
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
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// DB requests
app.use(function(req,res,next) {
    req.db = db;
    next();
});

app.use('/', routes);
app.use('/users', users);

/*app.use(methodOverride());
app.use(app.router);
app.use(session({ resave: true, saveUninitialized: true, secret: 'very-secret' }));*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;