var http = require ('http');              // For serving a basic web page.
var mongoose = require ("mongoose");      // The reason for this demo.
var querystring = require('querystring');

// The http server will listen to an appropriate port, or default to
// port 5000.
var port = process.env.PORT || 5000;




/***************** DATABASE CONNEXION AND INITIALIZATION ****************/

// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.
var MongoURI =
process.env.MONGOLAB_URI ||
process.env.MONGOHQ_URL ||
'mongodb://localhost/HelloMongoose';

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(MongoURI, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + MongoURI + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + MongoURI);
  }
});

var UserSchema = new mongoose.Schema({
  slack_id: { type: String },
  name: { type: String }
});

var User = mongoose.model('User', UserSchema);

var OperationSchema = new mongoose.Schema({
  slack_id_sender: { type: String },
  slack_id_receiver: { type: String },
  amount: { type: Number }
});

var Operation = mongoose.model('Operation', OperationSchema);



/***************** APPLICATION'S LOGIC ****************/

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

      var user = getOrCreateUser(decodedBody.user_id, decodedBody.user_name, function(user){

        var responseBody;
        if(user.justCreated){
          responseBody = { text : 'Bienvenue ' + user.name };

          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end( JSON.stringify(responseBody) );

        }else{
          findTarget(decodedBody.text, function(target){
            var amount = findAmount(decodedBody.text);

            amount = parseInt(amount);

            var op = new Operation({ slack_id_sender: user.slack_id, slack_id_receiver: target.slack_id, amount: amount  });
            op.save();

              processBank(user, function(user_bank){
                processBank(target, function(target_bank){

                  responseBody = { text : 'Donné ' + amount + ' à ' +target.name + '\n'+ user.name +':' + user_bank+ '\n'+ target.name+':' + target_bank };

                  res.writeHead(200, {'Content-Type': 'application/json'});
                  res.end( JSON.stringify(responseBody) );
              
              });

            });

          });
        }

      });

    });


}).listen(port, '127.0.0.1');

console.log('Server running at http://127.0.0.1:'+port);

var findTarget = function(text, callback){
  var target_id = text.match(/\<@(.*)\>/).pop();
    User.find({ slack_id: target_id}, function(err, users){
    callback(users[0]);
  });
  
}

var findAmount = function(text){
  var numbers = text.match(/\d+/);
  return numbers[0];
}

var processBank = function(user, callback){
  Operation.aggregate({ $group: { _id:{ slack_id_sender: user.slack_id } , total: {$sum: "$amount"} } } 
   , function(err, senders){
        console.log(senders);
    Operation.aggregate({ $group: { _id:{ slack_id_receiver: user.slack_id } , total: {$sum: "$amount"} } } 
       , function(err, receivers){
        console.log(receivers);
        callback(receivers[0].total - senders[0].total);
    });
  });

}


var getOrCreateUser = function(user_id, name, callback){

  User.find({ slack_id: user_id}, function(err, users){
  
    if (err) return console.error(err);

    var user;
    if (users.length == 0)
    {
      user = new User({ slack_id: user_id, name: name });
      user.save();
      user.justCreated = true;
    } 

    else
    {
      user = users[0];
      user.justCreated = false;
    }

    callback(user);

  });

}