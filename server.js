var http = require ('http');            // For serving a basic web page.
var mongoose = require ("mongoose"); 	// The reason for this demo.
var querystring = require('querystring');
var utils = require('utils');

// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.
var uristring =
process.env.MONGOLAB_URI ||
process.env.MONGOHQ_URL ||
'mongodb://localhost/HelloMongoose';

// The http server will listen to an appropriate port, or default to
// port 5000.
var theport = process.env.PORT || 5000;


// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);
  }
});

var UserSchema = new mongoose.Schema({
  slack_id: { type: String },
  name: { type: String }
});

var User = mongoose.model('User', UserSchema);


http.createServer(function (req, res) {
    var fullBody = '';


    req.on('data', function(chunk) {
      // append the current chunk of data to the fullBody variable
      fullBody += chunk.toString();
    });
    
    req.on('end', function() {
    
      // request ended -> do something with the data
      res.writeHead(200, "OK", {'Content-Type': 'text/html'});
      
      // parse the received body data
      var decodedBody = querystring.parse(fullBody);
      console.log(decodedBody);
 
    });


    var user = getOrCreateUser(req.user_id);

  	var responseBody = { text : 'ça marche !' };

  	res.writeHead(200, {'Content-Type': 'application/json'});
  	res.end( JSON.stringify(responseBody) );



}).listen(theport, '127.0.0.1');

console.log('Server running at http://127.0.0.1:8080/');






var getOrCreateUser = function(user_id, name){

  User.find({ slack_id: user_id}, function(err, users){
  
    if (err) return console.error(err);

    if (users.length == 0)
    {
      var user = new User({ slack_id: user_id, name: name });
      user.save();
      return user;
    } 

    else
    {
      return users[0];
    }

  });

}