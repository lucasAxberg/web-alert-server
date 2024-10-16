// Modules
const http = require("http");
const fs = require("node:fs");

// Server settings
const host = "localhost";
const port = 8000;
const data_path = "./data.json";

function read_file(filePath) {
	// Create a file stream with utf-8 encoding
	const file_stream = fs.createReadStream(filePath, "utf-8");

	// On read error, print the error in the console
	file_stream.on("error", (error) => {
		console.log(`error: ${error.message}`);
	});

	// On recieved data chunk, print the chunk
	file_stream.on("data", (chunk) => {
		console.log(chunk);
	});
}

function on_post_recieved() {
	console.log("POST request recieved");
}

function on_get_recieved() {
	console.log("GET request recieved");
	read_file(data_path);
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
