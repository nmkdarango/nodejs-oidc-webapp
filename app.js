var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
var stringify = require('json-stringify-safe');
var session = require('express-session');
var querystring = require('querystring');
var dotenv = require('dotenv');

/*Express App configuration*/
dotenv.config();
const result = dotenv.config();
if (result.error) {
  throw result.error;
}

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var mySession = {
	path: '/',
	secret: 'MYSECRET',
	name: 'cyberarkoidcclient',
	resave: false,
	saveUninitialized: true,
	httpOnly: true,
  	secure: false, //for only https
  	maxAge: null,
  	cookie: {},
};
app.use(session(mySession));
/*Tenant and Resource configurations*/
//In sync with configuration on Admin Portal
//make sure to enable CORS in Admin Portal in API Security 
//Also Add the below in your hosts file to 127.0.0.1 the same as the local host
const authFlow = process.env.AUTH_FLOW;
const appHostUrl = process.env.APP_HOST_URL;
const tenantFqdn = process.env.TENANT_FQDN;
const issuerUrl = process.env.ISSUER_URL;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const post_authorize_redirect= process.env.POST_AUTHORIZE_CALLBACK;//configure this in authorized web app redirect uris
const post_logout_callback = process.env.POST_LOGOUT_CALLBACK;
const resource_urlPath = process.env.RESOURCE_URL;//If follow resourcUrl approach, configure in web app on Admin

/*parameters required for invoking the client library*/
const { Issuer, generators } = require('openid-client');
const tenantUrl = 'https://'+tenantFqdn;
const redirect_uri = appHostUrl+post_authorize_redirect;
const post_logout_redirectUrl = [appHostUrl+post_logout_callback];
//scope
const scope = ['openid email profile'];
//response types
const response_types_auth_code_flow = 'code';
const response_types_implicit_flow = 'id_token token';
const response_types_hybrid_flow = 'code id_token token';
const response_types = {"authcode":response_types_auth_code_flow,"implicit":response_types_implicit_flow,"hybrid":response_types_hybrid_flow};
//response modes
const response_mode_implicit_hybrid_flows = 'form_post';
//checks
var nonce = generators.nonce();
var code_verifier = generators.codeVerifier();
var code_challenge = generators.codeChallenge(code_verifier);
const code_challenge_method = 'S256';
const currentState = '123abc';
//for styling and scripting for embedded login flow
const cyberArkInternalFileMap = '/vfslow/lib/uibuild/standalonelogin';
const cyberArkCss = tenantUrl+cyberArkInternalFileMap+'/css/login.css';
const cyberArkJs = tenantUrl+cyberArkInternalFileMap+'/login.js';
/*Passing locals to templates*/
app.use((req, res, next) => {
	res.locals.tenantFqdn = tenantFqdn;
	res.locals.cyberArkCss = cyberArkCss;
	res.locals.cyberArkJs = cyberArkJs;
	next();
})
/*routers*/
app.use('/', indexRouter);
app.use('/user', userRouter);
/*Actual Implementation*/
Issuer.discover(issuerUrl) // => Promise
.then(function (cyberarkIssuer) {
	const isAuthCodeFlow = authFlow == 'authcode';
//Initialize Client with the clientid etc. to be able to use the further endpoints within the client
const client = new cyberarkIssuer.Client({
	client_id: client_id,
	client_secret: client_secret,
	redirect_uris: [redirect_uri],
	response_types: [response_types[authFlow]],
	post_logout_redirect_uris: post_logout_redirectUrl
  }); // => Client

//Get the authorization endpoint url with the required parameters passed depending on the flow.
const authUrl = client.authorizationUrl({
	scope: scope,
	redirect_uri: redirect_uri,
	...(isAuthCodeFlow) && {code_challenge: code_challenge},
	...(isAuthCodeFlow) && {code_challenge_method: code_challenge_method},
	...(!isAuthCodeFlow) && {nonce: nonce},
	...(!isAuthCodeFlow) && {response_mode: response_mode_implicit_hybrid_flows},
	state: currentState
});

//post-auth: The callback method from redirect flow lands here because this is the redirect_uri provided in teh authorization endpoint
app.all(post_authorize_redirect, (req,res,next) => {
	const params = client.callbackParams(req);
	if(params.error) {
		res.locals.error = params.error;
		res.locals.error_description = params.error_description;
		req.session.destroy(function(err) {
			console.log("Destroyed the session");
			res.render('customerror');
		});
	}
	else {
		client.callback(redirect_uri, params, {
			...(isAuthCodeFlow) && {code_verifier: code_verifier},
			...(!isAuthCodeFlow) && {nonce: nonce},
			responseType: response_types[authFlow],
			state: currentState
		}) // => Promise
		.then(function (tokenSet) {
			req.session.sessionTokens = tokenSet;
			req.session.claims = tokenSet.claims();
		  }) // => Promise
		.then(function() {
			client.userinfo(req.session.sessionTokens.access_token)
			.then(function (userinfo) {
				req.session.user = userinfo;
			}).then(function (userinfo) {
				res.redirect('/');
			});
		});
	}
});

//callback methods to land on post auth
app.get(resource_urlPath, (req,res,next) => {
	res.redirect(authUrl);
});

//Primary logout method
app.get('/logout', function(req, res, next) {
	if(req.session.sessionTokens.access_token) {
		const logoutUrl = client.endSessionUrl({
			post_logout_redirectUri: post_logout_redirectUrl,
			token: req.session.sessionTokens.access_token,
			token_type_hint: 'access_token'
		});
		res.redirect(logoutUrl);
	}
});


//post_redirect_uri_callback: Session is destroyed here
app.get(post_logout_callback, function(req, res, next) {
	req.session.destroy(function(err) {
		res.render('navbar2', {"content":{"user":null,"loginStatus":false,"action": 'logout'}});
	});
});

//used to navigate as login
app.get('/redirectLogin', (req,res,next) => {
	res.redirect(authUrl);
});

//used to show loginwidget
app.get('/loginwidget', (req,res,next) => {
	res.render('navbar2', {"content":{"user":null,"loginStatus":false,"action": 'loginwidget'}});//, "authUrl": encodedUrlPath}});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
});
module.exports = app;
