/**
 * Module dependencies.
 */
var express = require('express');
var httpProxy = require('http-proxy');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var favicon = require('serve-favicon');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var methodOverride = require('method-override');

var _ = require('lodash');
var MongoStore = require('connect-mongo/es5')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');


/**
 * API keys.
 */
var secrets = require('./../config/secrets');

/**
 * Create Express server.
 */
var app = express();
var proxy = httpProxy.createProxyServer();

/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});

/**
 * Express configuration.
 */
app.set('host', process.env.HOST || 'localhost');
if (app.get('env') === 'development') {
  app.set('port', process.env.PORT || 4000);
} else {
  app.set('port', process.env.PORT || 3000);
}
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(logger('dev'));
app.use(favicon(path.join(__dirname, '../public', 'favicon.png')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({ url: secrets.db, autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca({
  csrf: true,
  xframe: 'SAMEORIGIN',
  xssProtection: true
}));
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  if (/api/i.test(req.path)) {
    req.session.returnTo = req.path;
  }
  next();
});
app.use(express.static(path.join(__dirname, '../public'), { maxAge: 31557600000 }));

// We only want to run the asset workflow when not in production
if (app.get('env') === 'development') {
  // Any requests to localhost:3000/scripts are proxied to webpack-dev-server
  app.all('/scripts/*', function (req, res) {
    proxy.web(req, res, { target: 'http://localhost:8080' });
  });
}


/**
 * Routes.
 */
require('./../config/routes')(app, passport)


/**
 * Error Handler.
 */
app.use(errorHandler());

// It is important to catch any errors from the proxy or the server will crash. An example of this is connecting to the
// server when webpack is bundling
proxy.on('error', function(e) {
  console.log('Could not connect to proxy, please try again...');
});

/**
 * Start Express server.
 */
var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on http://%s:%d in %s mode', app.get('host'), app.get('port'), app.get('env'));
});

// this function is called when you want the server to die gracefully
// i.e. wait for existing connections
var gracefulShutdown = function() {
  console.log("Received kill signal, shutting down Express gracefully.");
  server.close(function() {
    console.log("Closed out remaining connections.");
    process.exit()
  });
  
   // if after 
   setTimeout(function() {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit()
  }, 3000);
}

// listen for TERM signal .e.g. kill 
process.on ('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', gracefulShutdown);

module.exports = app;
