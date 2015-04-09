var http = require('http');

http.createServer(function (req, res) {
  
  	var responseBody = { text : 'ça marche !' };


  	res.writeHead(200, {'Content-Type': 'application/json'});
  	res.end( JSON.stringify(responseBody) );
}).listen(8080, '127.0.0.1');

console.log('Server running at http://127.0.0.1:8080/');