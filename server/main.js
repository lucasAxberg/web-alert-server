const http = require("http");

// Server settings
const host = "localhost";
const port = 8000;

function on_post_recieved() {
	console.log("POST request recieved");
}
function on_get_recieved() {
	console.log("GET request recieved");
}
function on_other_recieved() {
	console.log("UNKNOWN request recieved");
}

// Function for listening to interactions
const request_listener = function (request, response) {
	switch (request.method) {
		case "POST":
			on_post_recieved();
			break;

		case "GET":
			on_get_recieved();
			break;

		default:
			on_other_recieved();
	}
};

const server = http.createServer(request_listener);
server.listen(port, host, () => {
	console.log(`Server is running on http://${host}:${port}`);
});
