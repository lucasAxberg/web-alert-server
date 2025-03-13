// Modules
const http = require("http");
const { resolve } = require('node:path')
const { spawn } = require('child_process')
const {read_file, update_file, write_file, remove_key} = require("./functions.js")
const {data_path, host, port} = require("../data/config.js")

function on_data(response, request, index) {
	if (request.method === "DELETE") {
		// Read and parse data file
		read_file(data_path)
		.then((text_object) => JSON.parse(text_object))
		.then((data_object) => {

			// Parse sent data, remove the item with that key and update the file
			const updated_object = remove_key(data_object, index)
			write_file(data_path, updated_object)

			// Respond when successfull
			response.writeHead(200, {'Content-Type':'text/plain'})
			response.end('Data removed')
		})
	}	else if (request.method === "GET") {
		read_file(data_path)

			// Responds with the json object in a string
		.then((data) => {
			
			// Parse the read data
			let json_object = JSON.parse(data);

			// Filter object by sub-path if it existst
			if (Object.keys(json_object).includes(index)) {
				const filtered_entries = Object.entries(json_object).filter(([key, ]) => index === key);
				json_object = Object.fromEntries(filtered_entries)
			}	

			// Respond with data
			response.writeHead(200, { "Content-Type": "application/json" });
			response.end(JSON.stringify(json_object));
		})

		// Catches any error in the functions
		.catch((err) => {
			print_error(err);
			response.writeHead(404);
			response.end();
		});
		
	} else {
		// Respond with error if request isn't GET or DELETE
		response.writeHead(405, {'Content-Type':'text/plain'})
		response.end(`Method "${request.method}" is not allowed at endpoint "/data"`)
	}
}

function on_add(request, response) {
	// Add all data chunks into one array
	const chunks = [];
	request.on("data", (chunk) => {
		chunks.push(chunk);
	});

	request.on("end", () => {

		// Responds with error if wrong method was used
		if (request.method !== "POST") {
			response.writeHead(405, {'Content-Type':'text/plain'})
			response.end(`Method "${request.method}" is not allowed at endpoint "/add"`)
			return
		}

		try {
			// Read and parse the data_file	
			read_file(data_path)
			.then((text_data) => JSON.parse(text_data))
			.then((data_object) => {

				// Joins the data and updates the file
				const complete_data = JSON.parse(chunks.join(""));
				data_object[Object.keys(data_object).length] = complete_data
				write_file(data_path, data_object)

				// Responds on successful data recieved
				response.setHeader('Access-Control-Allow-Origin', '*') // Allows requests from all origins (TODO: Fix so not all)
				response.writeHead(200, {'Content-Type':'text/plain'})
				response.end('Data has been recieved successfully')
			})
	
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

function on_update(request, response, index) {
	// Return error if index is undefined or empty string
	if (!index) {
		response.writeHead(400, {'Content-Type':'text/plain'})
		response.end('No index specified. Add "/<index>" after "/update"')
		return
	}

	// Add all data chunks into one array
	const chunks = [];
	request.on("data", (chunk) => {
		chunks.push(chunk);
	});

	request.on("end", () => {
		// Responds with error if wrong method was used
		if (request.method !== "POST") {
			response.writeHead(405, {'Content-Type':'text/plain'})
			response.end(`Method "${request.method}" is not allowed at endpoint "/update"`)
			return
		}

		let new_object;
		try {
			new_object = JSON.parse(chunks.join(""))
		} catch {
			response.writeHead(400, {'Content-Type':'text/plain'})
			response.end('Data is not in correct JSON format')
			return
		} 

		// Read and parse data file
		read_file(data_path)
		.then((text_object) => JSON.parse(text_object))
		.then((data_object) => {
			// Respond with error if key doesn't exist
			if (!Object.keys(data_object).includes(index)) {
				response.writeHead(400, {'Content-Type':'text/plain'})
				response.end('Index does not exist in stored data')
				return
			}

			// Update objects value and write to file
			data_object[index] = new_object
			write_file(data_path, data_object)

			// Respond on successful save
			response.writeHead(200, {'Content-Type':'text/plain'})
			response.end('Data updated successfully')
		})
	})
		
}

function on_other_recieved() {
	print_log("UNKNOWN request recieved");
}

// Function for listening to interactions
const request_listener = function (request, response) {
	// Destruct the url_path
	const url_path_list = new URL(`http://${host}${request.url}`).pathname.split("/")
	url_path_list.shift()

	switch (url_path_list[0]) {
		case "update":
			on_update(request, response, url_path_list[1]);
			break;

		case "add":
			on_add(request, response)
			break;
		
		case "data":
			on_data(response, request, url_path_list[1]);
			break;

		default:
			on_other_recieved();
	}
};

function print_log(msg) {
	console.log('\x1b[0;32m<server>\x1b[0m', msg, '\n')
}
function print_error(msg) {
	console.log('\x1b[0;32m<server>\x1b[0m', msg, '\n')
}
const server = http.createServer(request_listener);
server.listen(port, host, () => {
	print_log(`Server is running on http://${host}:${port}`);
});

// Start watcher
const watcher = spawn('node', [resolve(__dirname, 'watcher.js')])
watcher.stdout.on('data',(data) => {console.log('\x1b[0;33m<watcher>\x1b[0m', data.toString())})
watcher.stderr.on('data',(error) => {console.error('\x1b[0;33m<watcher>\x1b[0m', error.toString())})
watcher.on('exit', (code) => {console.log('\x1b[0;33m<watcher>\x1b[0m exited with code', code.toString())})
