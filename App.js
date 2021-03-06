var RpcApi_1 = require("./server/ApplicationInterface/RpcApi");
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var favicon = require('serve-favicon');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var csrf = lusca.csrf();
var methodOverride = require('method-override');
var _ = require('lodash');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var sass = require('node-sass-middleware');
var homeController = require('./Server/Web/Controllers/home');
var userController = require('./Server/Web/Controllers/user');
var apiController = require('./Server/Web/Controllers/api');
var contactController = require('./Server/Web/Controllers/contact');
var secrets = require('./secrets');
var passportConf = require('./Server/Web/Controllers/passport');
var app = express();
var eng = require('./Server/Component/ServerEngine');
var configuration = require('./Configuration');
var ic = require('./Server/Component/InConnection');
var ws = require('express-ws')(app);
var db = require('./Server/Component/Database');
mongoose.connect(configuration.getConfiguration()['databaseUrl']);
mongoose.connection.on('error', function () {
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    process.exit(1);
});
app.set('port', process.env.PORT || configuration.getConfiguration()['port']);
app.set('views', path.join(__dirname, 'Client/src'));
app.set('view engine', 'jade');
app.use(compress());
app.use(sass({
    src: path.join(__dirname, 'Client'),
    dest: path.join(__dirname, 'Client'),
    debug: true,
    outputStyle: 'expanded'
}));
app.use(logger('dev'));
app.use(favicon(path.join(__dirname, 'Client', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: secrets.sessionSecret,
    store: new MongoStore({ url: configuration.getConfiguration()['databaseUrl'], autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca({
    csrf: false,
    xframe: 'SAMEORIGIN',
    xssProtection: true
}));
app.use(function (req, res, next) {
    var path = req.path;
    if (path === '/ws') {
        next();
    }
    else {
        csrf(req, res, next);
    }
});
app.use(function (req, res, next) {
    res.locals.user = req.user;
    next();
});
app.use(function (req, res, next) {
    next();
});
app.use(express.static(path.join(__dirname, 'Client'), { maxAge: 0 }));
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postTwitter);
app.get('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getVenmo);
app.post('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postVenmo);
app.get('/api/linkedin', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getInstagram);
app.get('/api/yahoo', apiController.getYahoo);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
app.get('/api/bitgo', apiController.getBitGo);
app.post('/api/bitgo', apiController.postBitGo);
app.get('/api/bitcore', apiController.getBitcore);
app.post('/api/bitcore', apiController.postBitcore);
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), function (req, res) {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function (req, res) {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function (req, res) {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function (req, res) {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function (req, res) {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), function (req, res) {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), function (req, res) {
    res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), function (req, res) {
    res.redirect('/api/tumblr');
});
app.get('/auth/venmo', passport.authorize('venmo', { scope: 'make_payments access_profile access_balance access_email access_phone' }));
app.get('/auth/venmo/callback', passport.authorize('venmo', { failureRedirect: '/api' }), function (req, res) {
    res.redirect('/api/venmo');
});
app.use(errorHandler());
app.listen(app.get('port'), function () {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});
module.exports = app;
var engine = new eng.ServerEngine(configuration.getConfiguration()['remoteServers']);
function mainLoop() {
    engine.loop();
    setTimeout(mainLoop, 1000);
}
mainLoop();
app.ws('/ws', function (ws, req) {
    var remoteAddress = req.client._peername.address;
    var remotePort = req.client._peername.port;
    var email;
    var userId;
    if (req.user) {
        email = req.user.email;
        userId = req.user._id;
    }
    var inConnection = new ic.InConnection(remoteAddress, remotePort, email, userId);
    inConnection.engine = engine;
    inConnection.sendObject = function (object) {
        try {
            ws.send(JSON.stringify(object));
        }
        catch (error) {
        }
    };
    inConnection.connect();
    engine.inConnections.push(inConnection);
    ws.on('message', function (msg) {
        inConnection.receive(JSON.parse(msg));
    });
});
var rpcApi = new RpcApi_1.ServerRpcApi(engine);
var rpcApiMethods = rpcApi.getRpcApiMethods();
app.post('/rpc', function (req, res) {
    res.header('Content-Type', 'application/json');
    var data = req.body, err = null, rpcMethod;
    if (!err && data.jsonrpc !== '2.0') {
        onError({
            code: -32600,
            message: 'Bad Request. JSON RPC version is invalid or missing',
            data: null
        }, 400);
        return;
    }
    if (!err && !(rpcMethod = rpcApiMethods[data.method])) {
        onError({
            code: -32601,
            message: 'Method not found : ' + data.method
        }, 404);
        return;
    }
    try {
        rpcMethod.apply(null, data.params).then(function (result) {
            res.status(200).send(JSON.stringify({
                jsonrpc: '2.0',
                result: JSON.stringify(result),
                error: null,
                id: data.id
            }));
        }).catch(function (error) {
            console.log('RPC error: ' + JSON.stringify(error));
            onError({
                code: -32603,
                message: 'Failed',
                data: error
            }, 500);
        });
    }
    catch (e) {
        console.log('RPC error: ' + JSON.stringify(e));
        onError({
            code: -32603,
            message: 'Exception at method call',
            data: e
        }, 500);
    }
    return;
    function onError(err, statusCode) {
        res.status(statusCode).send(JSON.stringify({
            jsonrpc: '2.0',
            error: JSON.stringify(err),
            id: data.id
        }));
    }
});
