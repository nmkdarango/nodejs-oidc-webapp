var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/home', function(req, res, next) {
  //res.render('navbar2', null);
  console.log("Landed up on home");
  res.redirect('/');
});

router.get('/', (req,res,next) => {
	console.log("HOME CALLED HERE!!!");
	console.log("user is here? ->  ", req.session.user != null);	
	console.log("sessionTokens are here? -> ", req.session.sessionTokens != null);
	if(req.session.user || req.session.sessionTokens) {
		console.log("sending some user..");
		res.render('navbar2', {"content":{"user":req.session.user,"loginStatus":false,"action":"login","sessionTokens":req.session.sessionTokens}});
	}
	else {
		console.log("redirecting to dummy page");
		res.render('navbar2', {"content":null});
	}
});



module.exports = router;
