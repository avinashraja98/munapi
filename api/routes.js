'use strict';



var cheerio = require('cheerio');

var bodyParser = require('body-parser');

module.exports = (app) => {  


	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

    app.route('/schedule')
        .post((req,res)=>{
			
		var request = require('request');
		var j = request.jar();
		var request = request.defaults({
		jar: j,
		followAllRedirects: true
		});
		
	    request.get({url:'https://login.mun.ca/cas/login?service=https%3A%2F%2Fchan.mun.ca%2Fdasher%2Fcourse-schedule%2Findex.php',jar:j}, function (error, response, body) {
		if(error){
			res.json({message:"Oops!!"});
			return;
		}
		
		request.post({
			headers: {'content-type' : 'application/x-www-form-urlencoded'},
			url:'https://login.mun.ca/cas/login?service=https%3A%2F%2Fchan.mun.ca%2Fdasher%2Fcourse-schedule%2Findex.php',
			jar:j,
			form: createFormData(req.body.username,req.body.password,body)
			}, function (error ,response, body) {
				if(error){
					res.json({message:"Oops!!"});
					return;
				}
				const $ = cheerio.load(body);
				
				res.json({schedule:$('div[id="course_container"]').children('div,div[class=col-sm-3]').text()}); //NEED TO FORMAT
			
		});
	});
    });

    app.use((req, res) => {
        res.status(404)
            .json({message:"Page Not Found!!!"});
    });
}
/***********************************

For successful login to take place, a post
request has to be made to https://login.mun.ca/cas/login
with six params. 
	1.username - specified by user
	2.password - specified by user
	3.execution - generated at every get request to login page
	4.lt - generated at every get request to login page
	5._eventId - "submit"
	6.submit - "log in"
This function generates the form object containing these params.

************************************/
function createFormData(username,password,htmlres){
	const $ = cheerio.load(htmlres);
	let hiddenData=$('form').find('input[type="hidden"]');//parse the html for these generated values
	let length=$('form').find('input[type="hidden"]').length;
	//create formData
	let formData={
		username:username,												//1.
		password:password												//2.
	};
	for(var i=0;i<length;i++){
		formData[hiddenData[i].attribs.name]=hiddenData[i].attribs.value;//3,4,5.
	}
	formData['submit']="log in"; 										//6.
	//formData has six attributes required for login
	return formData;
}