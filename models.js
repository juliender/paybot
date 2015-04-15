/***************** DATABASE CONNEXION AND INITIALIZATION ****************/
var mongoose = require ("mongoose");  

// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.
var MongoURI =
process.env.MONGOLAB_URI ||
process.env.MONGOHQ_URL ||
'mongodb://localhost/HelloMongoose';

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(MongoURI, function (err, res) {
  if (err) 
  {
    console.log ('ERROR connecting to: ' + MongoURI + '. ' + err);
  } 
  else {
    console.log ('Succeeded connected to: ' + MongoURI);
  }
});

var UserSchema = new mongoose.Schema({
  slack_id: { type: String },
  name: { type: String }
});


var OperationSchema = new mongoose.Schema({
  slack_id_sender: { type: String },
  slack_id_receiver: { type: String },
  amount: { type: Number }
});

var User = mongoose.model('User', UserSchema);
var Operation = mongoose.model('Operation', OperationSchema);

/*************************** EXPORTS ****************************/
module.exports = {

  User : User,

  Operation : Operation,

  // Current bank of a user
  processBank : function(user, callback){

     
    Operation.aggregate( {  $match : {slack_id_sender : user.slack_id}     },     {  $group : { _id : "$slack_id_sender", total : { $sum : "$amount" } }     }
     , function(err, senders){

      Operation.aggregate( {  $match : {slack_id_receiver : user.slack_id}     },     {  $group : { _id : "$slack_id_receiver", total : { $sum : "$amount" } }     }
         , function(err, receivers){

          var received = 0; 
          if(receivers.length > 0)
          {
              received = receivers[0].total;
          }

          var sent = 0; 
          if(senders.length > 0)
          {
              sent = senders[0].total;
          }
          callback( received - sent );
      });
    });

  },


  // Create and save the transaction in database
  newOperation : function(slack_id_sender_, slack_id_receiver_, amount_, callback){
        var op = new Operation({ slack_id_sender: slack_id_sender_, slack_id_receiver: slack_id_receiver_, amount: amount_  });
        op.save(callback);
  },

  // Create and save the user in database
  createUser : function(slack_id, name, callback){

      var user = new User({ slack_id: slack_id, name: name });
      user.save();

      callback(user);
  },

  // Find a user given it's slack_id
  getUser : function(slack_id, name, callback){

    User.find({ slack_id: slack_id}, function(err, users){
    
      if (err) return console.error(err);

      var user;
      if (users.length > 0)
      {
        callback(users[0]);
      } 

      else
      {
        callback(null);
      }

    });

  }
}