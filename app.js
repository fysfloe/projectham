/**
 * Start Script fired by bin/www
 */

var express = require('express'),
    logger = require('morgan'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    favicon = require('serve-favicon'),
    cookieParser = require('cookie-parser'),
    errorHandler = require('errorhandler'),
    http = require('http'),
    path = require('path');

var twitter = require('twitter');

// Routes
var routes = require('./routes/index');
var users = require('./routes/users');
var trends = require('./routes/trends');

// DB
var monk = require('monk');
var db = monk('localhost:27017/projectham');
//var db = monk('mongodb://projham_mongoadmin:twacoosDo@localhost:20870/projectham?authSource=admin'); todo: use for production on uberspace

var trendsCollection = db.get('trendslist'); // get trends collection
trendsCollection.ensureIndex( { datetime: 1 }, { expireAfterSeconds: 2400 });

var twit;

var CronJob = require('cron').CronJob;
var job = new CronJob({
    cronTime: '00 */10 * * * *',
    onTick: function() {
        // Run the job

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
                try {
                    if(res.statusCode == 200) {
                        trendsCollection.insert({
                            trends: data,
                            datetime: new Date()
                        });
                        console.log("Just got the latest trends from twitter.");
                    }
                } catch(e) {
                    console.log("No response from twitter trends. Not able to complete request.");
                }
            });
        }

        console.log("Cronjob completed.");
    },
    start: false
});
job.start();

// Express
var app = express();

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: false }));
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