// Modules
const http = require("http");
const {read_file, update_file} = require("./functions.js")
const {data_path} = require("../data/config.js")

// Server settings
const host = "localhost";
const port = 8000;


function on_post_recieved(request, response) {
	console.log("POST request recieved");

	// Get query parameters to look for which keys should me sent
	const query_parameter = new URL(`http://localhost${request.url}`).searchParams.get("delete")
	const remove = query_parameter === "true" ? true : false 
	
	// Add all data chunks into one array
	const chunks = [];
	request.on("data", (chunk) => {
		chunks.push(chunk);
	});

	request.on("end", () => {
		try {
			
			// Joins the data and updates the file
			const complete_data = JSON.parse(chunks.join(""));
			update_file(data_path, complete_data, remove);
	
			// Responds on successful data recieved
			response.setHeader('Access-Control-Allow-Origin', '*') // Allows requests from all origins (TODO: Fix so not all)
			response.writeHead(200, {'Content-Type':'text/plain'})
			response.end('Data has been recieved successfully')
		} catch (error) {
			
			// Respond properly to errors
			if (error.name == "SyntaxError"){
				
				// Responds on failed data convertion
				response.writeHead(400, {'Content-Type':'text/plain'})
				response.end('Data is not in proper JSON format')
			} else {

				// Responds with the servers error message on other error
				response.writeHead(400, {'Content-Type':'text/plain'})
				response.end(`Server error:\n${error}`)
			}
		}
	});
}

function on_get_recieved(response, request) {
	console.log("GET request recieved");

	// Get query parameters to look for which keys should me sent
	const query_params = new URL(`http://localhost${request.url}`).searchParams.get("keys")
	
	read_file(data_path)

		// Responds with the json object in a string
		.then((data) => {
			
			// Parse the read data
			let json_object = JSON.parse(data);

			// Filter object by keys in query parameters if query parameters exist
			if (query_params) {
				const keys = query_params.split(",")
				const filtered_entries = Object.entries(json_object).filter(([key, value]) => keys.includes(key));
				json_object = Object.fromEntries(filtered_entries)
			}	

			// Respond with data
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

function on_delete_recieved(response, request) {
	console.log("DELETE request recieved");

	// Get query parameters to look for which keys should me sent
	const query_parameter = new URL(`http://localhost${request.url}`).searchParams.get("index")
	
	read_file(data_path)
		.then((data_string) => JSON.parse(data_string))
		.then((data) => {

			// Filter object by keys in query parameters if query parameters exist
			if (query_parameter) {
				const new_object = remove_key(data, query_parameter)

				const writeStream = fs.createWriteStream(data_path);

				// Add error callback
				writeStream.on("error", (err) => {
					console.error(`Error writing to file ${file_path}:`, err);
				});

				// Write the updated json object to the file
				writeStream.write(JSON.stringify(new_object), "utf8");
				writeStream.end();
			}	

			// Respond with data
			response.writeHead(200, { "Content-Type": "plain/text" });
			response.end("Data remove successfulley");
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

function remove_key(data_object, indicies) {
	// Get entries and remove the one with the key 'index'
	const filteredEntries = Object.entries(data_object).filter(([key, ]) => indicies.includes(key) === false);

	// Update all entries keys to match their index
	for (let i = 0; i < filteredEntries.length; i++) {
		filteredEntries[i][0] = i.toString()
	}

	// Return an object created from the filtered entries
	return Object.fromEntries(filteredEntries);
}


// Function for listening to interactions
const request_listener = function (request, response) {
	switch (request.method) {
		case "POST":
			on_post_recieved(request, response);
			break;

		case "GET":
			on_get_recieved(response, request);
			break;

		case "DELETE":
			on_delete_recieved(response, request)
			break;

		default:
			on_other_recieved();
	}
};

const server = http.createServer(request_listener);
server.listen(port, host, () => {
	console.log(`Server is running on http://${host}:${port}`);
});
