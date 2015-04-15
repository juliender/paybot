var models = require('./models.js');

module.exports = {

  response : function(res, text){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end( text );
  },
  responseJson : function(res, text){
    var responseBody = { text : text };
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end( JSON.stringify(responseBody) );
  },

  // Find mentionned user to receive funds
  findTarget : function(text, callback){
    var target_ids = text.match(/\<@(.*)\>/);

    var target_id;
    if(target_ids != null && target_ids.length > 0)
    {

      target_id = target_ids.pop();
      
      models.User.find({ slack_id: target_id}, function(err, users){
        callback(users[0]);
      });
    }
    else
    {
      callback(null);
    } 
  },

  // Find amount to send
  findAmount : function(text){
    var numbers = text.match(/\d+/);
    if (numbers == null)
    {
      return null;
    }
    return numbers[0];
  }

}