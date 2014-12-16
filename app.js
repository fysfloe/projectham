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
var twitter = require('twitter');

// DB
var monk = require('monk');
var db = monk('localhost:27017/projectham');

// Routes
var routes = require('./routes/index');
var users = require('./routes/users');
var trends = require('./routes/trends');

var twit;

var CronJob = require('cron').CronJob;
var job = new CronJob({
    cronTime: '00 */10 * * * *',
    onTick: function() {
        // Run the job

        var trendsCollection = db.get('trendslist'); // get trends collection

        if(!twit) {
            twit = new twitter({
                consumer_key: "1bOq10EhTL8UoeBGokYWHcYmP",
                consumer_secret: "Z8zn26aTnADiosDN79TI5BrY7R5j7VYujmxC4CP94j5i654FnC",
                access_token_key: "1491329144-ms8q9JOx70n2Rs6AeuBfaHITv3ut2UrfGyuZcud",
                access_token_secret: "M82JbLOmIyLi8fZ9UXMsWac0Ksc85kM1N2eOBSrnw2HcO"
            });
            console.log("Logged in to twitter.");
        }

        if(twit) {
            twit.get('/trends/place.json', {id: 1}, function(data, res) {
                if(res.statusCode == 200) {
                    trendsCollection.insert({trends: data, datetime: new Date().toUTCString()});
                    console.log("Just got the latest trends from twitter.");
                }
            });
        }

        console.log("Cronjob completed.");
    },
    start: false
});
job.start();

var app = express();

// all environments
app.set('views', __dirname + '/views');
app.set('origins', 'http://localhost:*');
app.set('view engine', 'hjs');

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
app.use('/trends', trends);

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