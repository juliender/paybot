var http = require ('http');              // For serving a basic web page.
var querystring = require('querystring');

var bot = require('./bot.js');
var models = require('./models.js');
var helper = require('./helper.js');

// The http server will listen to an appropriate port, or default to
// port 5000.
var port = process.env.PORT || 5000;
var slack_token = process.env.SLACK_TOKEN;
var slack_token_command_hi = process.env.SLACK_COMMAND_HI_TOKEN;
var slack_token_command_mybangs = process.env.SLACK_COMMAND_MYBANGS_TOKEN;
var slack_token_command_allbangs = process.env.SLACK_COMMAND_ALLBANGS_TOKEN;

/***************** SERVER INIT ****************/
http.createServer(function (req, res) {
    var fullBody = '';

    req.on('data', function(chunk) {
      // append the current chunk of data to the fullBody variable
      fullBody += chunk.toString();
    });

    req.on('end', function() {

      // parse the received body data
      var decodedBody = querystring.parse(fullBody);

      if(decodedBody.token != slack_token 
        && decodedBody.token != slack_token_command_hi 
        && decodedBody.token != slack_token_command_mybangs
        && decodedBody.token != slack_token_command_allbangs )
      {
        helper.response(res, ' Authentication error : wrong token ');
        return;
      }

      if (decodedBody.user_id != 'USLACKBOT')
      {
        bot.handleRequest(decodedBody, res);
      }

    });

}).listen(port);

console.log('Server running at http://127.0.0.1:'+port);

