// Modules
const http = require("http");
const fs = require("node:fs");

// Server settings
const host = "localhost";
const port = 8000;
const data_path = "./data.json";

function read_file(file_path) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		const stream = fs.createReadStream(file_path, "utf-8");

		// Adds the recieved data chunks to an array
		stream.on("data", (data) => {
			chunks.push(data);
		});

		// 'Returns' the chunks array joined to a single string
		stream.on("end", () => {
			resolve(chunks.join(""));
		});

		// Reject the promise on error
		stream.on("error", (err) => {
			reject(err);
		});
	});
}

function on_post_recieved() {
	console.log("POST request recieved");
}

function on_get_recieved(response) {
	console.log("GET request recieved");
	read_file(data_path)
		// Responds with the json object in a string
		.then((data) => {
			json_object = JSON.parse(data);
			response.writeHead(200, { "Content-Type": "application/json" });
			response.end(JSON.stringify(json_object));
		})

		// Catches any error in the functions
		.catch((err) => {
			console.error(err);
			response.writeHead(404);
			response.end();
		});
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
			on_get_recieved(response);
			break;

		default:
			on_other_recieved();
	}
};

const server = http.createServer(request_listener);
server.listen(port, host, () => {
	console.log(`Server is running on http://${host}:${port}`);
});
