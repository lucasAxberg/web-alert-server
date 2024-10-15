const http = require("http");

// Server settings
const host = 'localhost';
const port = 8000;

// Function for listening to interactions
const request_listener = function(request, response){
  response.writeHead(200);
  response.end("My First Server!");
}

const server = http.createServer(request_listener);
server.listen(port, host, ()=> {
  console.log(`Server is running on http://${host}:${port}`)
})
