/*
Program Name: 	Practice Sessions and Requests
Author:			Howard Chen
Last Modified:	2-26-2017
Description: 	Implements a set of web pages that allows the user to
				create a new sessions by entering their name and a
				view count to stop counting at. When the view count is
				reached the screen's background will turn red and the view
				count will stop updating. In addition, the weather in
				New York City will be displayed to the screen in
				really large letters.
				
				User can choose to kill their session by clicking the
				appropriate button, as well as reset their count by clicking
				the appropriate button.
				
				a session's count will be displayed to the screen at all times.
*/

//
//Boilerplate Code from the lectures to set up the express-handlebars-bodyParser-sessions-request system.
//
var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars'); //names are assumed to be .handlebars files.
app.set('port', 8887);   //while you're logged in to flip this should be all right

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Set up sessions for this app
var session = require('express-session');
app.use(session({secret:'potato'}));

app.use(express.static('public'));

//Set up request for this app
var request = require('request');

var key = "&appid=" + "a6bb48efb29de53f44cb5c33f47653d2";
var units = "&units=" + "imperial";
var query = "http://api.openweathermap.org/data/2.5/weather?";
var zip = "98296";
var full = query + "zip=" + zip + ",us" + key + units;

app.get('/', function(req, res, next) {
	var context = {}
	context.type = "GET";
	if(!req.session.name){
		res.render("setup.handlebars", context);
		return;
	}
	context.name = req.session.name;
	context.limit = req.session.limit;
	context.count = req.session.count || 0;
	context.count += 1;
	req.session.count += 1;
	if(context.count >= context.limit)
	{
		context.script = "<script src='/limit.js'></script>"
		
		
		console.log("about to call OWM");
		request(full, function(err, response, body) {
			if(!err && response.statusCode > 100 && response.statusCode < 400)
			{
				owm = JSON.parse(body);
				console.log(body);
				context.city = owm.name;
				context.temp = owm.main.temp;
				context.humidity = owm.main.temp;
				res.render("home", context);
				return;
			}
			else
			{
				console.log(err);
				if(response){
					console.log(response.statusCode);
				}
				next(err);
			}
		});
		
	}
	else
	{
		request({
			"url":"http://httpbin.org/post",
			"method":"POST",
			"headers":{
				"Content-Type":"application/json"
			},
			"body":'{"foo":"bar","number":1}',
		}, function(err, response, body) {
			if(!err && response.statusCode < 400) {
				context.bin = body;
				console.log(context);
				res.render('home', context);
				return;
			} else {
				console.log(err);
				if(response) {
						console.log(response.statusCode);
				}
				next(err);
			}
		});
	}
});

app.post('/', function(req, res, next) {
	context = {};
	context.type = "POST";
	if(req.body["New Counter"]) {
		req.session.name = req.body.name;
		req.session.count = 0;
		req.session.limit = req.body.limit;
		req.session.save();  //session data is only saved automatically in GET requests.
	}
	if(req.body["DELETE SESSION"]) {
		req.session.destroy();
		return;
	}
	if(req.body["RESET COUNT"]) {
		req.session.count = 0;
		req.session.save();		 //session data is only saved automatically in GET requests.
		console.log(req.session);
		console.log("Count reset");
		return;
	}
	
	//If no session exists despite the POST, go to the setup page, and do nothing else.
	if(!req.session.name) {
		res.render("setup", context);
		return;
	}
	console.log(req.session);
	console.log(context);
	context.name = req.session.name || "ERROR NAME";
	context.limit = req.session.limit;
	context.count = req.session.count;
	context.count += 1;
	req.session.count += 1;
	
	if(context.count >= context.limit)
	{
		context.script="./limit.js"
	}
	
	console.log(req.session);
	console.log(context);
	res.render("home", context);
});


//Handle requests for unknown resources.
app.use(function(req,res) {
	res.status(404);
	res.render('404');
});

//handle server errors.
app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.type('plain\text');
	res.status(500);
	res.render('500');
});



//Start the app.
app.listen(app.get('port'), function() {
	console.log("Check started on port " + app.get("port") + "; press Ctrl-C to terminate.");
});