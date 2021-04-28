const createError = require('http-errors');
const express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
//const passport = require('passport');
//var dotenv = require('dotenv');
var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
let stringify = require('json-stringify-safe');
const session = require('express-session');
const querystring = require('querystring');

/*Express App configuration*/
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
app.use('/', indexRouter);
app.use('/user', userRouter);
//dotenv.config();
const authFlow = 'authcode';
const isAuthCodeFlow = authFlow == 'authcode';
/*Tenant and Resource configurations*/
//In sync with configuration on Admin Portal
//make sure to enable CORS in Admin Portal in API Security 
//Also Add the below in your hosts file to 127.0.0.1 the same as the local host
const appHostUrl = 'http://toyotafinancialnew.com:3000';
const tenantUrl = 'https://abc0123-kcv.my.localdev.idaptive.app';
const app_id = 'TestOIDCClient';
const client_id = 'ff7df88b-6cc1-4517-8a8a-dac7c769dafd';
const client_secret = 'mysecret';
const post_authorize_redirect= '/postauthorize';//configure this in authorized web app redirect uris
const post_logout_callback = '/logout/callback';
const resource_urlPath = '/resourceUrl';//If follow resourcUrl approach, configure in web app on Admin


/*parameters required for invoking the client library*/
const { Issuer, generators } = require('openid-client');
const issuerUrl = tenantUrl+'/'+app_id+'/';
const redirect_uri = appHostUrl+post_authorize_redirect;
const post_logout_redirectUrl = [appHostUrl+post_logout_callback];
//scope
const scope = ['openid email profile'];
//response types
const response_types_auth_code_flow = ['code'];
const response_types_implicit_flow = ['id_token token'];
const response_types_hybrid_flow = ['code id_token token'];
const response_types = {"authcode":response_types_auth_code_flow,"implicit":response_types_implicit_flow,"hybrid":response_types_hybrid_flow};
//response modes
const response_mode_implicit_hybrid_flows = 'form_post';
//checks
var nonce = generators.nonce();
var code_verifier = generators.codeVerifier();
var code_challenge = generators.codeChallenge(code_verifier);
const code_challenge_method = 'S256';
const currentState = '123abc';

/*Actual Implementation*/
Issuer.discover(issuerUrl) // => Promise
.then(function (cyberarkIssuer) {

//Initialize Client with the clientid etc. to be able to use the further endpoints within the client
const client = new cyberarkIssuer.Client({
	client_id: client_id,
	client_secret: client_secret,
	redirect_uris: redirect_uri,
	response_types: response_types[authFlow],
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
	//var strAuthUrl = authUrl.replace(tenantUrl,'');
	//var encodedUrlPath = encodeURIComponent(strAuthUrl.substring(1,strAuthUrl.length));
	//res.redirect('/loginwidget/home?cloudRedirect='+encodedUrlPath);
	res.render('navbar2', {"content":{"user":null,"loginStatus":false,"action": 'loginwidget'}});//, "authUrl": encodedUrlPath}});
});

//used to show loginwidget
// app.get('/loginwidget/home', (req,res,next) => {
// 	console.log("LOGIN WIDGET HOME CALLED HERE");
// 	res.render('navbar2', {"content":{"user":null,"loginStatus":false,"action": 'loginwidget'}});
// });

//used if have any postauth callback case
// app.post('/postauth/callback', (req,res,next) => {
// 	console.log("post auth post callback successfully called");
// 	res.end();
// 	  //next();
// });

// //used if have any postauth callback case
// app.get('/postauth/callback', (req,res,next) => {
// 	console.log("get post auth get callback successfully called");
// 	res.end();
// 	  //next();
// });


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


//event handlers


// app.get('/userinfo', (req,res,next) => {
// 	res.render('navbar2', {"content":{"user":req.session.user,"loginStatus":true,"action": 'userinfo',"sessionTokens":req.session.sessionTokens}});
// });



// app.get('/loginwidget/home', (req,res,next) => {
// 	// if(user) {
// 	// 	console.log("sending some user..");
// 	// 	res.render('navbar2', {"content":{"user":user},"action":"login"});
// 	// }
// 	// else {
// 		console.log("sending no content..");
// 		res.render('navbar2', {"content":null});
// 	//}
// });

module.exports = app;
