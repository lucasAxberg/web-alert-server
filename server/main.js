// Modules
const http = require("http");
const { resolve } = require('node:path')
const { spawn } = require('child_process')
const {read_file, update_file, write_file} = require("./functions.js")
const {data_path, host, port} = require("../data/config.js")

function on_post_recieved(request, response) {
	print_log("POST request recieved");

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
	print_log("GET request recieved");

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
			print_error(err);
			response.writeHead(404);
			response.end();
		});
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

function on_other_recieved() {
	print_log("UNKNOWN request recieved");
}

// Function for listening to interactions
const request_listener = function (request, response) {
	const url = new URL(`http://${host}${request.url}`)
	console.log(url.pathname)
	switch (url.pathname) {
		case "/update":
			on_post_recieved(request, response);
			break;

		case "/remove":
			on_post_recieved(request, response);
			break;

		case "/add":
			on_add(request, response)
			break;
		
		case "/data":
			on_get_recieved(response, request);
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
