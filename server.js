var http = require ('http');              // For serving a basic web page.
var mongoose = require ("mongoose");      // The reason for this demo.
var querystring = require('querystring');

// The http server will listen to an appropriate port, or default to
// port 5000.
var port = process.env.PORT || 5000;

var slack_token = process.env.SLACK_TOKEN;


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

      var responseBody;
      if(decodedBody.token != slack_token)
      {
          responseBody = { text : ' Authentication error : wrong token ' };
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end( JSON.stringify(responseBody) );
          return;
      }


      // Create the user if does not exists, or find him in DB 
      var user = getOrCreateUser(decodedBody.user_id, decodedBody.user_name, function(user){

        if(user.justCreated)
        {
        

        //TODO : prevent an exchange to be catched here if the message contains hi
          if ( decodedBody.text.indexOf("hi") > -1)
          {
            responseBody = { text : 'Bienvenue ' + user.name + ' !' };
          }
          else
          {
            responseBody = { text : 'Vous devez commencer par " bangs: hi " ' };
          }

          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end( JSON.stringify(responseBody) );

        }else{

          // First find for who is the money
          findTarget(decodedBody.text, function(target){

            if(target == null)
            {
              responseBody = { text : 'Le destinataire n\'existe pas ou n\'a pas dit "bangs: hi" ' };
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end( JSON.stringify(responseBody) );
              return;
            }

            // Second find how many
            var amount = findAmount(decodedBody.text);
            amount = parseInt(amount);

            if(amount == null)
            {
              responseBody = { text : 'Vous devez préciser la somme dans votre message !' };
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end( JSON.stringify(responseBody) );
              return;
            }

            // Finally save the bank operation in DB and display updated funds. 
            var op = new Operation({ slack_id_sender: user.slack_id, slack_id_receiver: target.slack_id, amount: amount  });
            op.save();

              processBank(user, function(user_bank){
                processBank(target, function(target_bank){

                  responseBody = { text : 'Bangs envoyés ! ' + amount + ' à ' +target.name + '\n'+ user.name +':' + user_bank+ ' bangs\n'+ target.name+':' + target_bank + ' bangs' };

                  res.writeHead(200, {'Content-Type': 'application/json'});
                  res.end( JSON.stringify(responseBody) );
              
              });

            });

          });
        }

      });

    });


}).listen(port);

console.log('Server running at http://127.0.0.1:'+port);



/********************** HELPERS *********************/


// Find mentionned user to receive funds
var findTarget = function(text, callback){
  var target_id = text.match(/\<@(.*)\>/).pop();
    User.find({ slack_id: target_id}, function(err, users){
    callback(users[0]);
  });
  
}

// Find amount to send
var findAmount = function(text){
  var numbers = text.match(/\d+/);
  return numbers[0];
}

// Current bank of a user
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


// Find a user givenn it's slack_id
var getOrCreateUser = function(slack_id, name, callback){

  User.find({ slack_id: slack_id}, function(err, users){
  
    if (err) return console.error(err);

    var user;
    if (users.length == 0)
    {
      user = new User({ slack_id: slack_id, name: name });
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