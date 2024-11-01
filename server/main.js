// Modules
const http = require("http");
const fs = require("node:fs");

// Server settings
const host = "localhost";
const port = 8000;
const data_path = "data.json";

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

function update_file(file_path, new_data) {
	// Check if the file exists and save it to a variable
	let exists;
	try {
		exists = fs.statSync(file_path).isFile();
	} catch (err) {
		console.error(err)
		exists = false;
	}

	if (exists) {
		read_file(file_path).then((data) => {

			// Create an empty object and fill it with the data if the file exists
			let json_object = {};
			json_object = JSON.parse(data);

			// Assign the value from each key in new data to json_object
			for (const key in new_data) {
				json_object[key] = new_data[key];
			}
			
			// Create writestream
			const writeStream = fs.createWriteStream(file_path);

			// Print error on error
			writeStream.on("error", (err) => {
				console.error(`Error writing to file ${file_path}:`, err);
			});

			// Write the updated json object to the file
			writeStream.write(JSON.stringify(json_object), "utf8");
			writeStream.end();
		});
	}

}

function on_post_recieved(request, response) {
	console.log("POST request recieved");

	// Add all data chunks into one array
	const chunks = [];
	request.on("data", (chunk) => {
		chunks.push(chunk);
	});

	request.on("end", () => {
		complete_data = JSON.parse(chunks.join(""));

		update_file(data_path, complete_data);
		response.writeHead(200, {'Content-Type':'text/plain'})
		response.end('Data has been recieved successfully')
	});
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
			on_post_recieved(request, response);
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
