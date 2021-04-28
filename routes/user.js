var express = require('express');
var router = express.Router();
var utl = require('util');
var querystring = require('querystring');


const tenantUrl = "https://abc0123-kcv.my.localdev.idaptive.app"

/* User Operations */

router.get('/userinfo', (req,res,next) => {
	res.render('navbar2', {"content":{"user":req.session.user,"loginStatus":true,"action": 'userinfo',"sessionTokens":req.session.sessionTokens}});
});

router.get('/response', (req,res,next) => {
	res.render('navbar2', {"content":{"user":req.session.user,"loginStatus":true,"action": 'response',"sessionTokens":req.session.sessionTokens,"claims":req.session.claims}});
});

router.get('/tokens', (req,res,next) => {
	res.render('navbar2', {"content":{"user":req.session.user,"loginStatus":true,"action": 'tokens',"sessionTokens":req.session.sessionTokens,"claims":req.session.claims}});
});

router.get('/claims', (req,res,next) => {
	res.render('navbar2', {"content":{"user":req.session.user,"loginStatus":true,"action": 'claims',"sessionTokens":req.session.sessionTokens,"claims":req.session.claims}});
});

router.post('/login', function (req, res, next) {
//const loginMode = req.body.inputLoginMode;
//console.log(loginMode);
console.log(req.body);
//     let loginResult = login(username, req.body.password);
// if (loginResult) {
//         res.render('users', {username: username});
//     }
//     else {
//         res.render('index', {error: true});
//     }
});

module.exports = router;
